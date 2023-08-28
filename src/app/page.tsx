import { Product, Variation } from "@/types/woocommerce";
import { getCredential } from "@/utils/api";
import ProductConfigurator from "./components/ProductConfigurator";
import { useShoppingCart } from "./components/CartContext";
import Cart from "./components/Cart";

export default async function Home() {
  const products = await getData();

  const { token } = await getCredential(
    process.env.ADMIN_USERNAME as string,
    process.env.ADMIN_PASSWORD as string
  );

  return (
    <>
      <Cart token={token} />
      <ProductConfigurator
        product={
          products.filter((product) => product.slug === "film-holder")[0]
        }
      />
      <ProductConfigurator
        product={products.filter((product) => product.slug === "film-mask")[0]}
      />
      <div>
        {products.map((item: Product) => (
          <div key={item.id}>
            <p>{item.name + item.id}</p>
            {(item.variations as Variation[]).map((variation: Variation) => (
              <pre key={variation.id}>
                {variation.id}
                {JSON.stringify(variation.attributes)}
              </pre>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

async function getData() {
  let apiCallCount = 0; // Initialize the API call counter

  const { token } = await getCredential(
    process.env.ADMIN_USERNAME as string,
    process.env.ADMIN_PASSWORD as string
  );

  let res: Response = await fetch(`${process.env.API_URL}/wc/v3/products`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  });

  apiCallCount++; // Increment the counter for the main products API call

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  let products: Product[] = await res.json();

  products = await Promise.all(
    products.map(async (product: Product) => {
      let crossSells: Product[] = [];

      const newVariations: Variation[] = await fetch(
        `${process.env.API_URL}/wc/v3/products/${product.id}/variations?per_page=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).then((res) => {
        apiCallCount++; // Increment the counter for variation API call
        return res.json();
      });

      product.variations = newVariations;

      await Promise.all(
        product.cross_sell_ids.map(async (item) => {
          const crossSellResponse = await fetch(
            `${process.env.API_URL}/wc/v3/products/${item}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          apiCallCount++; // Increment the counter for cross-sell product API call

          if (crossSellResponse.ok) {
            const crossSell: Product = await crossSellResponse.json();

            const crossSellVariationsResponse = await fetch(
              `${process.env.API_URL}/wc/v3/products/${crossSell.id}/variations?per_page=100`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            apiCallCount++; // Increment the counter for cross-sell variations API call

            if (crossSellVariationsResponse.ok) {
              const crossSellVariations: Variation[] =
                await crossSellVariationsResponse.json();
              crossSell.variations = crossSellVariations;
              crossSells.push(crossSell);
            }
          }
        })
      );

      product.cross_sell_products = crossSells;

      return product;
    })
  );

  console.log("Total API calls made:", apiCallCount);
  return products;
}
