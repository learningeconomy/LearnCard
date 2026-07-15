/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Issuelater4Inputs */

const en_boostcms_issuelater4 = /** @type {(inputs: Boostcms_Issuelater4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue Later`)
};

const es_boostcms_issuelater4 = /** @type {(inputs: Boostcms_Issuelater4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emitir Después`)
};

const fr_boostcms_issuelater4 = /** @type {(inputs: Boostcms_Issuelater4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Délivrer plus tard`)
};

const ar_boostcms_issuelater4 = /** @type {(inputs: Boostcms_Issuelater4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Issue Later`)
};

/**
* | output |
* | --- |
* | "Issue Later" |
*
* @param {Boostcms_Issuelater4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_issuelater4 = /** @type {((inputs?: Boostcms_Issuelater4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Issuelater4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_issuelater4(inputs)
	if (locale === "es") return es_boostcms_issuelater4(inputs)
	if (locale === "fr") return fr_boostcms_issuelater4(inputs)
	return ar_boostcms_issuelater4(inputs)
});
export { boostcms_issuelater4 as "boostCMS.issueLater" }