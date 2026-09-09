# frozen_string_literal: true
# Offline fixtures against the real section, not a reimplementation of its logic.
# Run: gem install liquid -v 5.8.7 --no-document
#      ruby scripts/blog_feed_fixtures.rb [path/to/blog-featured-latest.liquid]
# Synthetic data only. No credentials, Shopify writes, browser, or network calls.
require 'json'
require 'digest'
require 'liquid'

# Shopify/Rails supplies blank?; standalone Ruby does not. Model the primitive
# fixture values explicitly so nil/empty fields behave like storefront values.
class Object
  def blank?; respond_to?(:empty?) ? !!empty? : !self; end
end
class String
  def blank?; strip.empty?; end
end
raise 'Fixture blank semantics failed' unless nil.blank? && ''.blank? && !{'id' => 1}.blank?

module AssetStubs
  def asset_url(value); value; end
  def stylesheet_tag(_value); ''; end
end
Liquid::Template.register_filter(AssetStubs)
class CardFileSystem
  def read_template_file(name)
    raise "Unexpected snippet: #{name}" unless name == 'article-card'
    '<i data-fixture-card="{{ article.id }}" data-fixture-handle="{{ article.handle }}"></i>'
  end
end
Liquid::Template.file_system = CardFileSystem.new

path = ARGV[0] || 'sections/blog-featured-latest.liquid'
original = File.read(path, encoding: 'UTF-8')
schema = original.match(/{%\s*schema\s*%}(.*?){%\s*endschema\s*%}/m)
raise 'Missing section schema' unless schema
JSON.parse(schema[1])
# Shopify presentation-only tags are omitted; all selection/validation/render logic stays.
source = original.gsub(/{%-?\s*schema\s*-?%}.*?{%-?\s*endschema\s*-?%}/m, '')
                 .gsub(/{%-?\s*style\s*-?%}.*?{%-?\s*endstyle\s*-?%}/m, '')
template = Liquid::Template.parse(source, error_mode: :strict)

def record(id, blog: 'alpha', rank: nil, type: 'number_integer', featured: false, legacy: false)
  field = rank.nil? ? nil : { 'type' => type, 'value' => rank }
  {
    'id' => id, 'handle' => "#{blog}/item-#{id}",
    'published_at' => format('%08d', 100_000 - id),
    'tags' => featured ? ['featured'] : (legacy ? ['featured:top'] : []),
    'image' => { 'aspect_ratio' => 1 },
    'metafields' => { 'custom' => { 'featured_rank' => field } }
  }
end

def payload(rows, max: 9, slots: 6, handles: nil, counts: {}, omit_lookup: [])
  grouped = rows.group_by { |row| row.fetch('handle').split('/').first }
  blogs = grouped.transform_values do |items|
    name = items.first.fetch('handle').split('/').first
    # Model Shopify's accessible per-blog slice explicitly; do not claim full pagination.
    { 'handle' => name, 'articles' => items.first(50),
      'articles_count' => counts.fetch(name, items.length) }
  end
  lookup = rows.to_h { |row| [row.fetch('handle'), row] }
  omit_lookup.each { |key| lookup.delete(key) }
  {
    'section' => { 'id' => 'fixture', 'settings' => {
      'max_cards' => max, 'featured_slots' => slots,
      'blog_handles' => handles || grouped.keys.join(','),
      'heading' => 'Fixture feed', 'show_image' => false, 'show_date' => false,
      'show_author' => false, 'padding_top' => 36, 'padding_bottom' => 36
    } },
    'request' => { 'design_mode' => false }, 'blogs' => blogs, 'articles' => lookup
  }
end

def outcome(template, input)
  html = template.render!(input, strict_filters: true)
  ids = html.scan(/data-fixture-card="(\d+)"/).flatten.map(&:to_i)
  marker = html.match(/FEATURED_FEED_RENDERED count=(\d+) max=(\d+) state=(\w+)/)
  raise 'Missing render marker' unless marker
  reasons = html[/data-hold-reasons="([^"]*)"/, 1].to_s.split(',').reject(&:empty?)
  { 'ids' => ids, 'count' => marker[1].to_i, 'max' => marker[2].to_i,
    'state' => marker[3], 'reasons' => reasons }
end

tests = []
add = lambda do |name, input, ids:, state:, reason: nil, absent: nil|
  result = outcome(template, input)
  errors = []
  errors << "cards #{result['ids'].inspect}, expected #{ids.inspect}" unless result['ids'] == ids
  errors << 'count marker differs from rendered cards' unless result['count'] == result['ids'].length
  errors << 'duplicate IDs' unless result['ids'].uniq == result['ids']
  errors << "state #{result['state']}, expected #{state}" unless result['state'] == state
  errors << "missing reason #{reason}" if reason && !result['reasons'].include?(reason)
  errors << "unexpected reason #{absent}" if absent && result['reasons'].include?(absent)
  tests << { 'name' => name, 'status' => errors.empty? ? 'PASS' : 'FAIL',
             'result' => result, 'errors' => errors }
rescue StandardError => e
  tests << { 'name' => name, 'status' => 'ERROR', 'errors' => ["#{e.class}: #{e.message}"] }
end

plain = (1..20).map { |id| record(id) }
ranked = (1..6).map { |rank| record(20 + rank, rank: rank, featured: true) }
add.call('zero-eligible fallback', payload(plain), ids: (1..9).to_a, state: 'hold', reason: 'incomplete_eligible_set')
add.call('valid ranks use qualified Liquid handles', payload(ranked.reverse + plain), ids: (21..26).to_a + [1,2,3], state: 'ok')
add.call('six valid ranks with three-card cap is configuration HOLD', payload(ranked + plain, max: 3), ids: [1,2,3], state: 'hold', reason: 'slots_exceed_card_limit', absent: 'out_of_range_rank')
add.call('zero-rank reduced-card setting', payload(plain, max: 3), ids: [1,2,3], state: 'hold', reason: 'slots_exceed_card_limit')
add.call('six-card exact rank layout', payload(ranked + plain, max: 6), ids: (21..26).to_a, state: 'ok')
add.call('three configured ranks and three visible cards', payload(ranked.first(3) + plain, max: 3, slots: 3), ids: [21,22,23], state: 'ok')
add.call('legacy featured:top is not exact featured', payload(plain.map { |r| r.merge('tags' => ['featured:top']) }), ids: (1..9).to_a, state: 'hold', reason: 'incomplete_eligible_set')

bulk = (1..60).map { |id| record(id, blog: id <= 30 ? 'alpha' : 'beta', rank: ((id-1)%6)+1, featured: true) }
bulk += (61..80).map { |id| record(id, blog: id <= 70 ? 'alpha' : 'beta') }
add.call('sixty newest tagged; older non-featured still fill nine', payload(bulk), ids: (61..69).to_a, state: 'hold', reason: 'excess_eligible_articles')
add.call('seventh eligible article remains unpinned', payload(ranked + [record(27, rank: 7, featured: true)] + plain), ids: (1..9).to_a, state: 'hold', reason: 'excess_eligible_articles')
add.call('missing rank', payload(ranked.drop(1) + [record(21, featured: true)] + plain), ids: (1..9).to_a, state: 'hold', reason: 'missing_rank')
add.call('wrong rank type', payload(ranked.drop(1) + [record(21, rank: '1', type: 'single_line_text_field', featured: true)] + plain), ids: (1..9).to_a, state: 'hold', reason: 'non_integer_rank')
add.call('duplicate rank', payload(ranked.drop(1) + [record(21, rank: 2, featured: true)] + plain), ids: (1..9).to_a, state: 'hold', reason: 'duplicate_rank')
add.call('out-of-range rank', payload(ranked.drop(1) + [record(21, rank: 7, featured: true)] + plain), ids: (1..9).to_a, state: 'hold', reason: 'out_of_range_rank')
add.call('qualified lookup genuinely missing', payload(ranked + plain, omit_lookup: ['alpha/item-21']), ids: (1..9).to_a, state: 'hold', reason: 'rank_lookup_failed')
add.call('unknown configured blog', payload(plain, handles: 'alpha,unknown'), ids: (1..9).to_a, state: 'hold', reason: 'unknown_blog_handle')
add.call('incomplete per-blog traversal remains explicit HOLD', payload(plain, counts: {'alpha' => 60}), ids: (1..9).to_a, state: 'hold', reason: 'incomplete_traversal')
add.call('fewer available articles is honest short feed', payload(plain.first(4)), ids: [1,2,3,4], state: 'hold', reason: 'incomplete_eligible_set')
add.call('empty catalog', payload([], handles: ''), ids: [], state: 'hold', reason: 'no_articles_found')

report = { 'kind' => 'offline-real-Liquid-section-fixtures', 'liquid_version' => Liquid::VERSION,
  'section_sha256' => Digest::SHA256.hexdigest(original), 'tests' => tests,
  'pass' => tests.count { |r| r['status'] == 'PASS' },
  'fail' => tests.count { |r| r['status'] != 'PASS' },
  'limitations' => ['Not Shopify-hosted rendering or browser/device QA.',
    'Presentation-only style/schema tags and article-card markup are stubbed.',
    'Primitive blank? behavior and per-blog accessible slice are explicitly modeled.'] }
puts JSON.pretty_generate(report)
exit(report['fail'].zero? ? 0 : 1)
