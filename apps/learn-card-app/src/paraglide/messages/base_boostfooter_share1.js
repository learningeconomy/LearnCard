/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Base_Boostfooter_Share1Inputs */

const en_base_boostfooter_share1 = /** @type {(inputs: Base_Boostfooter_Share1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share`)
};

const es_base_boostfooter_share1 = /** @type {(inputs: Base_Boostfooter_Share1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir`)
};

const fr_base_boostfooter_share1 = /** @type {(inputs: Base_Boostfooter_Share1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager`)
};

const ar_base_boostfooter_share1 = /** @type {(inputs: Base_Boostfooter_Share1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة`)
};

/**
* | output |
* | --- |
* | "Share" |
*
* @param {Base_Boostfooter_Share1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const base_boostfooter_share1 = /** @type {((inputs?: Base_Boostfooter_Share1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Base_Boostfooter_Share1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_base_boostfooter_share1(inputs)
	if (locale === "es") return es_base_boostfooter_share1(inputs)
	if (locale === "fr") return fr_base_boostfooter_share1(inputs)
	return ar_base_boostfooter_share1(inputs)
});
export { base_boostfooter_share1 as "base.boostFooter.share" }