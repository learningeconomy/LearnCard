/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Codeblock_Copycode3Inputs */

const en_developerportal_components_codeblock_copycode3 = /** @type {(inputs: Developerportal_Components_Codeblock_Copycode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy code`)
};

const es_developerportal_components_codeblock_copycode3 = /** @type {(inputs: Developerportal_Components_Codeblock_Copycode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar código`)
};

const fr_developerportal_components_codeblock_copycode3 = /** @type {(inputs: Developerportal_Components_Codeblock_Copycode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier le code`)
};

const ar_developerportal_components_codeblock_copycode3 = /** @type {(inputs: Developerportal_Components_Codeblock_Copycode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نسخ الكود`)
};

/**
* | output |
* | --- |
* | "Copy code" |
*
* @param {Developerportal_Components_Codeblock_Copycode3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_codeblock_copycode3 = /** @type {((inputs?: Developerportal_Components_Codeblock_Copycode3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Codeblock_Copycode3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_codeblock_copycode3(inputs)
	if (locale === "es") return es_developerportal_components_codeblock_copycode3(inputs)
	if (locale === "fr") return fr_developerportal_components_codeblock_copycode3(inputs)
	return ar_developerportal_components_codeblock_copycode3(inputs)
});
export { developerportal_components_codeblock_copycode3 as "developerPortal.components.codeBlock.copyCode" }