var ShopifyProduct = window.product;
    
function getNthMonday(year, month, n) {
  let m = moment(`${year}-${month < 10 ? '0' + month : month}-01`);
  let firstMonday = m.isoWeekday(1);
  if (firstMonday.month() !== m.month()) {
    firstMonday.add(7, 'days');
  }
  return firstMonday.clone().add((n - 1) * 7, 'days');
}

var TransitTimeCalculator = {
  processingTime: null,
  displayTransitTimes: async function() {
    try {
      const locationRes = await fetch("https://french-fitness-api.azurewebsites.net/api/location");
      const userLoc = await locationRes.json();
      let originalZipCode = userLoc.postal;
      
      if (sessionStorage.userPostal !== 'null') {
        if (!sessionStorage.userPostal) {
          sessionStorage.userPostal = userLoc.postal;
        } else {
          userLoc.postal = sessionStorage.userPostal;
        }
      }
      
      sessionStorage.userCityStateZip = `${userLoc.city} ${userLoc.region_code}`;
      
      if (userLoc.postal) {
        let locationInfoResponse;
        try {
          const locInfoRes = await fetch(`https://french-fitness-api.azurewebsites.net/api/location/locationInfo/${userLoc.postal}`);
          locationInfoResponse = await locInfoRes.json();
        } catch (e) {
          //TransitTimeCalculator.appendInvalidTransitTime();
          return;
        }
        
        if (locationInfoResponse) {
          let locationInfoCountry = locationInfoResponse.country;

          if (locationInfoResponse.zipCodeLocationResult) {
            const parsed = JSON.parse(locationInfoResponse.zipCodeLocationResult);
            const locationInfoJSON = Array.isArray(parsed) ? parsed[0] : parsed;

            userLoc.region_code = locationInfoJSON.region_code || locationInfoJSON.state || locationInfoJSON.province;
            userLoc.city = locationInfoJSON.city;
            userLoc.country = locationInfoJSON.country_code || locationInfoCountry;
            if (locationInfoJSON.state === 'PR') {
              userLoc.country = 'PR';
            }
          }


          if (locationInfoCountry) {
            userLoc.country = locationInfoCountry;
            userLoc.country_code = locationInfoCountry;
          }
          sessionStorage.userCityStateZip = `${userLoc.city} ${userLoc.region_code}`;
        } else {
          if (userLoc.country !== 'CA' && userLoc.country !== 'US' && userLoc.country !== 'PR') {
            TransitTimeCalculator.appendInvalidTransitTime();
            return;
          }
        }
      }
      
      const distanceFromBenicia = await TransitTimeCalculator.getDistanceFromBenicia(userLoc.postal, userLoc.country_code);
      
      let deliveryOptionText = '';
      let minDeliveryTime = 0, maxDeliveryTime = 0;
      let processingTimeMin = 0, processingTimeMax = 0;
      let monthTransitTimes = {};
      
      if (!ShopifyProduct) return;

      const product = ShopifyProduct;
      const productWeight = parseFloat(product.weight);
      
      let processingTime = TransitTimeCalculator.processingTime;
      
      if (!TransitTimeCalculator.extractMonthName(processingTime)) {
        const transitTime = TransitTimeCalculator.calculateDaysFromText(processingTime);
        processingTimeMin = transitTime.minDays;
        processingTimeMax = transitTime.maxDays;
      } else {
        monthTransitTimes = TransitTimeCalculator.calculateDaysToFutureMonth(processingTime);
        processingTimeMin = monthTransitTimes.minDays;
        processingTimeMax = monthTransitTimes.maxDays;
      }

      let faiSelect = document.querySelector('select[name="Full Assembly & Installation"]');
      if (faiSelect) {
        let clonedSelect = faiSelect.cloneNode(true);
        faiSelect.parentNode.replaceChild(clonedSelect, faiSelect);
        clonedSelect.value = faiSelect.value;
        clonedSelect.addEventListener('change', async () => {
          await TransitTimeCalculator.displayTransitTimes();
        });
        let selectedOption = clonedSelect.options[clonedSelect.selectedIndex];
        if (selectedOption) {
          let faiOptionText = selectedOption.text;
          deliveryOptionText = faiOptionText.includes("Curbside") ? "Curbside Delivery" : faiOptionText;
        }
        faiSelect = clonedSelect;
      }
      
      let state = userLoc.region_code;
      let deliveryOption = deliveryOptionText.toLocaleLowerCase();
      
      // Adjust delivery times for US-CA based on distance and product weight.
      if (userLoc.country === 'US' && state === "CA") {
        if (distanceFromBenicia != null) {
          if (distanceFromBenicia <= 150 && productWeight >= 30) {
            // No adjustment needed.
          } else if (distanceFromBenicia <= 150 && productWeight < 30) {
            minDeliveryTime += 1; maxDeliveryTime += 1;
          } else if (distanceFromBenicia > 150 && productWeight >= 30 && (deliveryOption.includes('curbside') || deliveryOption.includes('garage'))) {
            minDeliveryTime += 1; maxDeliveryTime += 4;
          } else if (distanceFromBenicia > 150 && productWeight < 30 && deliveryOption.includes('curbside')) {
            minDeliveryTime += 1; maxDeliveryTime += 2;
          } else if (distanceFromBenicia > 150 && deliveryOption.includes('room')) {
            minDeliveryTime += 3; maxDeliveryTime += 8;
          }
        }
      }
      
      // Adjustments for non-CA US states.
      if (userLoc.country === 'US' && state !== 'CA' && productWeight > 30) {
        switch (state) {
          case "NV": minDeliveryTime += 3; maxDeliveryTime += 4; break;
          case "AZ":
          case "OR": minDeliveryTime += 3; maxDeliveryTime += 5; break;
          case "WA":
          case "ID":
          case "UT":
          case "CO": minDeliveryTime += 4; maxDeliveryTime += 7; break;
          case "NM":
          case "TX":
          case "MT":
          case "OK":
          case "NE":
          case "SD":
          case "ND":
          case "KS": minDeliveryTime += 5; maxDeliveryTime += 10; break;
          case "AL":
          case "KY":
          case "TN":
          case "MI":
          case "MS":
          case "OH": minDeliveryTime += 7; maxDeliveryTime += 11; break;
          case "PA":
          case "DE":
          case "NJ":
          case "VA":
          case "MD":
          case "WV":
          case "GA":
          case "NC":
          case "SC":
          case "NY": minDeliveryTime += 9; maxDeliveryTime += 12; break;
          case "ME":
          case "NH":
          case "VT":
          case "MA":
          case "RI":
          case "CT":
          case "FL": minDeliveryTime += 10; maxDeliveryTime += 14; break;
          case "HI":
          case "AK": minDeliveryTime += 12; maxDeliveryTime += 20; break;
          default: minDeliveryTime += 6; maxDeliveryTime += 10; break;
        }
      }
      
      // Adjustments for Canadian provinces.
      if (userLoc.country === 'CA') {
        switch (state) {
          case 'BC': minDeliveryTime += 6; maxDeliveryTime += 10; break;
          case 'ON':
          case 'AB':
          case 'MB':
          case 'SK':
          case 'QC': minDeliveryTime += 9; maxDeliveryTime += 12; break;
          case 'NS':
          case 'NF':
          case 'NW':
          case 'PEI': minDeliveryTime += 10; maxDeliveryTime += 15; break;
        }
      }
      
      // Add installation time if applicable.
      if (deliveryOptionText) {
        if (deliveryOptionText.toLowerCase().includes("room") ||
            deliveryOptionText.toLowerCase().includes("process") ||
            deliveryOptionText.toLowerCase().includes("custom")) {
          minDeliveryTime += 3; maxDeliveryTime += 5;
        }
      }
      
      TransitTimeCalculator.momentInitHolidays();
      
      // FedEx rules for non-CA US regions.
      if (userLoc.country_code === 'US' && userLoc.region_code !== 'CA' && productWeight < 30) {
        const fedexDays = TransitTimeCalculator.calculateFedexDeliveryDays(userLoc.region_code);
        if (fedexDays) {
          minDeliveryTime += fedexDays;
          maxDeliveryTime += fedexDays;
        }
      }
      
      const processingTimeMinDate = moment().add(processingTimeMin, 'days');
      const processingTimeMaxDate = moment().add(processingTimeMax, 'days');
      const minDeliveryTimeDate = moment(processingTimeMinDate).businessAdd(minDeliveryTime).format('ddd, MMM D');
      const maxDeliveryTimeDate = moment(processingTimeMaxDate).businessAdd(maxDeliveryTime).format('ddd, MMM D');
      
      let estimatedTimeText = ` Estimated by ${minDeliveryTimeDate} - ${maxDeliveryTimeDate}`;
      
      TransitTimeCalculator.appendTransitTime(estimatedTimeText, deliveryOptionText);

      setTimeout(() => {
        const shippingCalcBtn = document.querySelector('.docapp-shipping-calculator--button');
        if (shippingCalcBtn) {
          shippingCalcBtn.addEventListener('click', () => {
            const zipInput = document.querySelector('.docapp-shipping-calculator--input-zip');
            sessionStorage.userPostal = zipInput.value.replace(/\s+/g, '');
            const calcText = TransitTimeCalculator.getTransitTimeText() +
              `<span class="transit-time-text">Calculating Transit Times...</span>`;
            const container = document.querySelector('.transit-times-container');
            if (container) { container.innerHTML = calcText; }
            TransitTimeCalculator.displayTransitTimes();
          });
        }
      }, 500);
      
    } catch (err) {
      console.error(err);
      //TransitTimeCalculator.appendInvalidTransitTime();
    }
  },
  
  getDistanceFromBenicia: async function(postal, country) {
    if (country === 'US') {
      try {
        const res = await fetch(`https://french-fitness-api.azurewebsites.net/api/location/distancefrombenicia/${postal}`);
        return await res.json();
      } catch (err) {
        console.error(err);
        return null;
      }
    }
    return null;
  },

  calculateFedexDeliveryDays: function(state) {
    const stateDeliveryDays = {
      "NY": 1, "NJ": 1, "CT": 1, "RI": 1, "MA": 1, "MD": 1,
      "DE": 2, "VA": 2, "WV": 2, "PA": 2, "OH": 2, 
      "KY": 2, "NC": 2, "SC": 2, "GA": 2, "FL": 2, "AL": 2, 
      "MS": 2, "TN": 2, "MI": 2, "IN": 2, "IL": 2, "IA": 2,
      "WI": 2, "MO": 2, "AR": 2, "LA": 2,
      "TX": 3, "OK": 3, "KS": 3, "NE": 3, "SD": 3, "ND": 3,
      "MN": 3, "CO": 3,
      "AZ": 4, "UT": 4, "NM": 4, "WY": 4, "MT": 4,
      "WA": 5, "OR": 5, "CA": 5, "ID": 5, "NV": 5,
      "AK": 7, "HI": 7
    };
    
    const deliveryDays = {
      Monday:    [1, 2, 3, 4, 5, 6, 7],
      Tuesday:   [1, 2, 3, 4, 5, 6, 7],
      Wednesday: [1, 2, 3, 4, 5, 6, 7],
      Thursday:  [1, 2, 3, 4, 5, 6, 7],
      Friday:    [1, 2, 3, 4, 5, 6, 7],
      Saturday:  [2, 3, 4, 5, 6, 7, 8],
      Sunday:    [2, 3, 4, 5, 6, 7, 8]
    };
    
    const today = new Date(); 
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = daysOfWeek[today.getDay()];
    const regionDeliveryTime = stateDeliveryDays[state];
    if (regionDeliveryTime === undefined) { return 0; }
    return deliveryDays[currentDay][regionDeliveryTime - 1];
  },
  
  // Compute US federal holidays for the current year.
  momentInitHolidays: function() {
    var year = new Date().getFullYear();
    // Fixed-date holidays.
    var newYear = moment(`${year}-01-01`).format('DD-MM-YYYY');
    var independenceDay = moment(`${year}-07-04`).format('DD-MM-YYYY');
    var veteransDay = moment(`${year}-11-11`).format('DD-MM-YYYY');
    var christmas = moment(`${year}-12-25`).format('DD-MM-YYYY');
    
    // Dynamic holidays.
    var mlkDay = getNthMonday(year, 1, 3).format('DD-MM-YYYY');            // Third Monday in January.
    var presidentsDay = getNthMonday(year, 2, 3).format('DD-MM-YYYY');       // Third Monday in February.
    var memorialDay = moment(`${year}-05-31`).isoWeekday(-1).format('DD-MM-YYYY'); // Last Monday in May.
    var laborDay = getNthMonday(year, 9, 1).format('DD-MM-YYYY');             // First Monday in September.
    var columbusDay = getNthMonday(year, 10, 2).format('DD-MM-YYYY');         // Second Monday in October.
    
    // Thanksgiving: Fourth Thursday in November.
    let novemberFirst = moment(`${year}-11-01`);
    let firstThursday = novemberFirst.isoWeekday(4);
    if (firstThursday.month() !== 10) { 
      firstThursday.add(7, 'days');
    }
    var thanksgiving = firstThursday.add(21, 'days').format('DD-MM-YYYY');
    
    moment.updateLocale('us', {
      holidays: [newYear, mlkDay, presidentsDay, memorialDay, independenceDay, laborDay, columbusDay, veteransDay, thanksgiving, christmas],
      holidayFormat: 'DD-MM-YYYY'
    });
  },
  
  appendTransitTime: function(estimatedTimeText, installMethodText) {
    let finalText = `<span class="transit-time-text">${estimatedTimeText}</span>`;
    const container = document.querySelector('.transit-times-container');
    if (container) { container.innerHTML = finalText; }
  },
  
  appendTransitTimeError: function() {
    let finalText = `<span class="transit-time-text">No Transit Times found for ${sessionStorage.userPostal} ZipCode</span>`;
    const container = document.querySelector('.transit-times-container');
    if (container) { container.innerHTML = finalText; }
  },
  
  appendInvalidTransitTime: function() {
    let finalText = `<span class="transit-time-text">The Transit Time Calculator only has info for USA & Canada Postal Codes. Please enter a valid Postal Code or Contact Us for Transit Times</span>`;
    const container = document.querySelector('.transit-times-container');
    if (container) { container.innerHTML = finalText; }
  },

  
  extractMonthName: function(text) {
    const regexPattern = /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b/i;
    const match = text.match(regexPattern);
    return match ? match[0] : null;
  },
  
  calculateDaysToFutureMonth: function(text) {
    const monthName = TransitTimeCalculator.extractMonthName(text);
    if (!monthName) return { minDays: 0, maxDays: 0 };
    let currentDate = moment();
    let targetMonth = moment(monthName, "MMMM").year(currentDate.year());
    if (targetMonth.isBefore(currentDate, 'month')) { targetMonth.add(1, 'year'); }
    let firstDayOfMonth = targetMonth.clone().startOf('month');
    let lastDayOfMonth = targetMonth.clone().endOf('month');
    let minDays = firstDayOfMonth.diff(currentDate, "days");
    let maxDays = lastDayOfMonth.diff(currentDate, "days");
    return { minDays: minDays + 1, maxDays: maxDays };
  },
  
  calculateDaysFromText: function(text) {
    const regexPattern = /(\d+)\s*-\s*(\d+)\s*(\w+)/i;
    const match = text.match(regexPattern);
    if (!match) { return { minDays: 0, maxDays: 0 }; }
    const minAmount = parseInt(match[1], 10);
    const maxAmount = parseInt(match[2], 10);
    const unit = match[3].toLowerCase();
    const minDays = TransitTimeCalculator.convertToDays(minAmount, unit);
    const maxDays = TransitTimeCalculator.convertToDays(maxAmount, unit);
    return { minDays, maxDays };
  },
  
  convertToDays: function(amount, unit) {
    switch (unit) {
      case 'days': return amount;
      case 'weeks': return amount * 7;
      case 'months': return amount * 30;
      default: return amount;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
    fetchProductDetailsWithMetafields(window.product.id).then((product) => {	 
        const processingTimeMetafield = product.metafields.find(
            (metafield) => metafield.key === "processing_time"
        );

        if (processingTimeMetafield) {
            TransitTimeCalculator.processingTime = processingTimeMetafield.value;
            TransitTimeCalculator.displayTransitTimes();
        }
    });
});

async function fetchProductDetailsWithMetafields(productId) {
    const productUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/product/${productId}`;
    const metafieldsUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/metafields/${productId}/`;
  
    try {
      const [productResponse, metafieldsResponse] = await Promise.all([
        fetch(productUrl, { method: 'GET' }),
        fetch(metafieldsUrl, { method: 'GET' })
      ]);
  
      if (!productResponse.ok || !metafieldsResponse.ok) {
        throw new Error('Failed to fetch product details or metafields');
      }
  
      const productData = await productResponse.json();
      const metafieldsData = await metafieldsResponse.json();
  
      productData.product.metafields = metafieldsData.metafields;
      return productData.product;
    } catch (error) {
      console.error('Error fetching product details with metafields:', error);
      return null;
    }
  }
  
  async function fetchProductMetaObject(metaObjectId) {
    const shopifyUrl = `https://fitnesssuperstore-api.azurewebsites.net/api/shopify/metaobject?metaobjectId=${metaObjectId}`;
  
    try {
      const response = await fetch(shopifyUrl, {
        method: 'GET'
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch metaobject');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error fetching meta object:', error);
      return null;
    }
  }