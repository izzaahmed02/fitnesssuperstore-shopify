let allProducts=[],productIndex=new Map,isFetching=!1,isInitialFetchComplete=!1,currentFilteredProducts=[];const titleSelector=".title",CACHE_KEY=`products_index_${window.currentCollectionId||"default"}`,CACHE_VERSION="1.0",CACHE_TTL=864e5,GET_COLLECTION_PRODUCTS=`
  query GetCollectionProducts($collectionId: ID!, $first: Int!, $after: String) {
    collection(id: $collectionId) {
      products(first: $first, after: $after) {
        edges {
          node {
            id
            handle
            title
            vendor
            availableForSale
            variants(first: 1) {
              edges {
                node {
                  id
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                  sku
                }
              }
            }
            metafields(identifiers: [
              { namespace: "custom", key: "condition_state" },
              { namespace: "custom", key: "processing_time" },
              { namespace: "custom", key: "brand" }
            ]) {
              key
              value
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;