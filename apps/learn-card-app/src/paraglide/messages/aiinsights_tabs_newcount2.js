/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Aiinsights_Tabs_Newcount2Inputs */

const en_aiinsights_tabs_newcount2 = /** @type {(inputs: Aiinsights_Tabs_Newcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} New`)
};

const es_aiinsights_tabs_newcount2 = /** @type {(inputs: Aiinsights_Tabs_Newcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Nuevo`)
};

const fr_aiinsights_tabs_newcount2 = /** @type {(inputs: Aiinsights_Tabs_Newcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Nouveau`)
};

const ar_aiinsights_tabs_newcount2 = /** @type {(inputs: Aiinsights_Tabs_Newcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} جديد`)
};

/**
* | output |
* | --- |
* | "{count} New" |
*
* @param {Aiinsights_Tabs_Newcount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_tabs_newcount2 = /** @type {((inputs: Aiinsights_Tabs_Newcount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Tabs_Newcount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_tabs_newcount2(inputs)
	if (locale === "es") return es_aiinsights_tabs_newcount2(inputs)
	if (locale === "fr") return fr_aiinsights_tabs_newcount2(inputs)
	return ar_aiinsights_tabs_newcount2(inputs)
});
export { aiinsights_tabs_newcount2 as "aiInsights.tabs.newCount" }