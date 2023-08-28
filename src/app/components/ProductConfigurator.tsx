"use client";
import { Attribute, Product, Variation } from "@/types/woocommerce";
import { Controller, useForm } from "react-hook-form";
import { RadioGroup, Switch } from "@headlessui/react";
import sanitizeHtml from "sanitize-html";
const HtmlToReact = require("html-to-react");
const HtmlToReactParser = require("html-to-react").Parser;
import Tag from "./Tag";
import { FaCheckCircle } from "react-icons/fa";
import { Tab } from "@headlessui/react";
import { Fragment, useState } from "react";
import { toSentenceCase } from "@/utils/utils";
import Image from "next/image";
import { useShoppingCart } from "./CartContext";

const isValidNode = function () {
  return true;
};

// Order matters. Instructions are processed in the order they're defined
const processNodeDefinitions = new HtmlToReact.ProcessNodeDefinitions();
const processingInstructions = [
  {
    // Custom <li> processing
    shouldProcessNode: function (node: any) {
      return node.parent && node.parent.name && node.parent.name === "li";
    },
    processNode: function (node: any, children: any) {
      return (
        <span className="flex gap-2 items-center shrink-0 mb-2">
          <FaCheckCircle color="#EFAF23" size={16} className="shrink-0" />
          {node.data}
        </span>
      );
    },
  },
  {
    // Anything else
    shouldProcessNode: function (node: any) {
      return true;
    },
    processNode: processNodeDefinitions.processDefaultNode,
  },
];
const htmlToReactParser = new HtmlToReactParser();

interface Option {
  name: string;
  values: string[];
}

function extractOptions(attributes: Attribute[]): Option[] {
  const extractedOptions: any = [];

  attributes.forEach((attribute) => {
    if (attribute.variation && attribute.options) {
      extractedOptions.push({
        name: attribute.name,
        values: attribute.options.map((option: any) => option), // Assuming your options have a "value" property
      });
    }
  });

  return extractedOptions;
}

function findMatchingVariation(
  variations: Variation[],
  selectedAttributes: Record<string, string>
): Variation | undefined {
  return variations.find((variation) => {
    return Object.keys(selectedAttributes).every((attributeName) => {
      const matchingAttribute = variation.attributes.find(
        (attribute) => attribute.name === attributeName
      );

      if (matchingAttribute) {
        return matchingAttribute.option === selectedAttributes[attributeName];
      }

      return false;
    });
  });
}

interface Selection extends Product {
  quantity?: number;
  variation_id?: number;
}

export default function ProductConfigurator({ product }: { product: Product }) {
  const { addToCart, cartItems } = useShoppingCart();

  const [selectedCrossSellProducts, setSelectedCrossSellProducts] = useState<
    Product[]
  >([]);


  const crossSellTotalPrice: number = selectedCrossSellProducts.reduce(
    (totalPrice: number, product: Product) => {
      return totalPrice + Number(product.price);
    },
    0
  );

  const productOptions = extractOptions(product.attributes);

  const defaultValues = productOptions.reduce(
    (acc: Record<string, string>, option: Option) => {
      acc[option.name] = option.values[0]; // Set default to the first option
      return acc;
    },
    {}
  );

  const { handleSubmit, control, watch } = useForm({ defaultValues });
  const watchedValues = watch();

  const selectedVariation = findMatchingVariation(
    product.variations as Variation[],
    watchedValues
  ) as Variation;

  const selectedVariationInCart = cartItems.some((element) => element?.variation_id === selectedVariation.id)
  console.log(selectedVariationInCart)


  const handleCrossSellChange = (product: Product) => {
    setSelectedCrossSellProducts((prevProducts) => {
      if (prevProducts.includes(product)) {
        return prevProducts.filter((p) => p !== product);
      } else {
        return [...prevProducts, product];
      }
    });
  };

  const onSubmit = () => {
    const crossSellsCart = selectedCrossSellProducts.map((product) => {
      const crossSellProductVariation = findMatchingVariation(
        product.variations as Variation[],
        { "Film size": watchedValues["Film size"] }
      ) as Variation;

      return {
        ...product,
        variation_id: crossSellProductVariation.id,
        attributes: crossSellProductVariation.attributes,
        quantity: 1,
      };
    });

    const configuredItems: Selection[] = [
      {
        ...product,
        variation_id: selectedVariation.id,
        attributes: selectedVariation.attributes,
        quantity: 1,
      },
      ...crossSellsCart,
    ];

    configuredItems.forEach((item: Selection) => {
      addToCart(item);
    });

    console.log(configuredItems);
  };

  const totalPrice = Number(selectedVariation?.price) + crossSellTotalPrice;

  return (
    <div className="flex w-full max-w-7xl mx-auto mt-24 gap-12 relative">
      <div className="flex flex-col w-3/5 gap-12 shrink-0">
        <div className="relative w-full aspect-video bg-blue-200 rounded-lg overflow-hidden">
          \
          {product?.images?.[0] ? (
            <Image
              src={product?.images[0].src}
              alt={product?.images[0].alt}
              height={480}
              width={640}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
        </div>
        <div className="bg-white p-8 rounded-lg border border-neutral-300 font-light flex flex-col gap-8">
          <Tab.Group>
            <Tab.List className="w-full border-b border-neutral-300 flex gap-8">
              <Tab as={Fragment}>
                {({ selected }) => (
                  /* Use the `selected` state to conditionally style the selected tab. */
                  <button
                    className={`
                      ${
                        selected
                          ? "font-semibold border-[#EFAF23]"
                          : "bg-white text-black border-transparent"
                      } pb-3   border-b-2
                    `}
                  >
                    Description
                  </button>
                )}
              </Tab>
              {product?.acf?.product_tabs
                ? Object.keys(product?.acf?.product_tabs).map((tab) => (
                    <Tab as={Fragment} key={`product-${product.id}-tab-${tab}`}>
                      {({ selected }) => (
                        /* Use the `selected` state to conditionally style the selected tab. */
                        <button
                          className={`
						${
              selected
                ? "font-semibold border-[#EFAF23]"
                : "bg-white text-black border-transparent"
            } pb-3   border-b-2
					  `}
                        >
                          {toSentenceCase(tab.split("_").join(" "))}
                        </button>
                      )}
                    </Tab>
                  ))
                : null}
            </Tab.List>
            <Tab.Panels>
              <Tab.Panel className=" flex flex-col gap-4">
                {htmlToReactParser.parseWithInstructions(
                  product.description,
                  isValidNode,
                  processingInstructions
                )}
              </Tab.Panel>
              {product?.acf?.product_tabs
                ? Object.values(product?.acf?.product_tabs).map(
                    (values: any, index: number) => (
                      <Tab.Panel key={`product-${product.id}-panel-${index}`}>
                        <table className="w-full text-left font-light">
                          {Object.entries(values).map(
                            ([key, value]: [string, any]) => (
                              <tr
                                key={key}
                                className="border-b dark:border-neutral-500 last:border-0 "
                              >
                                <td className="pr-6  py-4 w-1/3 font-semibold">
                                  {toSentenceCase(key.split("_").join(" "))}
                                </td>
                                <td className="whitespace-pre-line px-6  py-4 ">
                                  {value}
                                </td>
                              </tr>
                            )
                          )}
                        </table>
                      </Tab.Panel>
                    )
                  )
                : null}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
      <aside className="w-2/5 shrink-0">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-12 "
        >
          <div className="bg-white flex flex-col gap-12 p-8 rounded-lg border border-neutral-300">
            <div className="flex flex-col gap-4">
              <Tag label={product.categories[0].name as string} />
              <h2 className="font-inter text-3xl font-semibold  ">
                {product.name}
              </h2>
              <p>
                {sanitizeHtml(product.short_description, { allowedTags: [] })}
              </p>
            </div>

            {productOptions.map((option: any) => {
              return (
                <Controller
                  key={`controller-${option.name}`}
                  name={option.name}
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      key={`film-size-radio-group-${field.value}`}
                      value={field.value}
                      onChange={field.onChange}
                      className="flex flex-col gap-4"
                    >
                      <RadioGroup.Label className="font-medium text-lg">{`Choose ${option.name}`}</RadioGroup.Label>
                      <div className="grid grid-cols-2 gap-4">
                        {option.values.map((option: any) => (
                          <RadioGroup.Option value={option} key={option}>
                            {({ checked }) => (
                              <div
                                role="button"
                                className={`${
                                  checked
                                    ? "bg-[#FFEFCB] border-2 border-[#EFAF23] shadow-[2px_2px_0_0_#EFAF23] font-semibold text-[#63170C]"
                                    : "bg-white border m-px border-neutral-300 text-neutral-400"
                                } relative flex items-center gap-6 w-full h-full p-4 rounded-md cursor-pointer text-sm`}
                              >
                                <div
                                  className={`${
                                    checked
                                      ? "bg-[#EFAF23] border border-transparent"
                                      : " border border-neutral-300"
                                  } w-[68px] h-[45px] shrink-0`}
                                />
                                {option}
                              </div>
                            )}
                          </RadioGroup.Option>
                        ))}
                      </div>
                    </RadioGroup>
                  )}
                />
              );
            })}
            {!!product?.cross_sell_products?.length ? (
              <div className="flex flex-col gap-4">
                <label className="font-medium text-lg">{`Choose accessories`}</label>
                <div className="grid grid-cols-2 gap-4">
                  {product.cross_sell_products?.map(
                    (crossSellProduct: Product) => {
                      return (
                        <Switch
                          checked={selectedCrossSellProducts.includes(
                            crossSellProduct
                          )}
                          key={crossSellProduct.name + crossSellProduct.id}
                          onChange={() =>
                            handleCrossSellChange(crossSellProduct)
                          }
                        >
                          {({ checked }) => (
                            <div
                              role="button"
                              className={`${
                                checked
                                  ? "bg-[#FFEFCB] border-2 border-[#EFAF23] shadow-[2px_2px_0_0_#EFAF23] font-semibold text-[#63170C]"
                                  : "bg-white border m-px border-neutral-300 text-neutral-400"
                              } relative flex items-center gap-6 w-full h-full p-4 rounded-md cursor-pointer text-sm`}
                            >
                              <div
                                className={`${
                                  checked
                                    ? "bg-[#EFAF23] border border-transparent"
                                    : " border border-neutral-300"
                                } w-[68px] h-[45px] shrink-0`}
                              />
                              <div className="flex flex-col w-full ">
                                <span className="text-left">
                                  {crossSellProduct.name}
                                </span>
                                <span className="text-left text-xs">
                                  £{Number(crossSellProduct.price).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </Switch>
                      );
                    }
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <div className="bg-white flex flex-between gap-12 p-8 rounded-lg border border-neutral-300">
            <div className="w-full flex flex-col">
              <span>Total price</span>
              <span className="text-3xl font-semibold ">
                {totalPrice.toFixed(2)}
              </span>
            </div>
            {!selectedVariationInCart ? <button
              type="submit"
              className="bg-[#FFEFCB] border-2 border-[#EFAF23] shadow-[2px_2px_0_0_#EFAF23] font-semibold text-[#63170C] rounded-md py-4 px-8 text-xl shrink-0"
            >
              Add to cart
            </button> : <div className=" border border-neutral-300 font-semibold text-neutral-400 rounded-md py-4 px-8 text-xl shrink-0">In cart</div>}
          </div>
        </form>
      </aside>
    </div>
  );
}
