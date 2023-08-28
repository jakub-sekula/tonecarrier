import { Attribute } from "@/types/woocommerce";

export function toSentenceCase(input: string): string {
	if (!input) {
		return '';
	}

	const words = input.toLowerCase().split(' ');

	for (let i = 0; i < words.length; i++) {
		words[i] = words[i][0].toUpperCase() + words[i].slice(1);
	}

	return words.join(' ');
}

export function formatAttributes(attributes: Attribute[]): string {
	return attributes.reduce((formattedString, attribute, index) => {
		const separator = index === 0 ? '' : ' / ';
		return formattedString + separator + attribute.option;
	}, '');
}