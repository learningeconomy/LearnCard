/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Continueissue4Inputs */

const en_boostcms_continueissue4 = /** @type {(inputs: Boostcms_Continueissue4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue Issuing`)
};

const es_boostcms_continueissue4 = /** @type {(inputs: Boostcms_Continueissue4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seguir Emitiendo`)
};

const fr_boostcms_continueissue4 = /** @type {(inputs: Boostcms_Continueissue4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer la délivrance`)
};

const ar_boostcms_continueissue4 = /** @type {(inputs: Boostcms_Continueissue4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة الإصدار`)
};

/**
* | output |
* | --- |
* | "Continue Issuing" |
*
* @param {Boostcms_Continueissue4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_continueissue4 = /** @type {((inputs?: Boostcms_Continueissue4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Continueissue4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_continueissue4(inputs)
	if (locale === "es") return es_boostcms_continueissue4(inputs)
	if (locale === "fr") return fr_boostcms_continueissue4(inputs)
	return ar_boostcms_continueissue4(inputs)
});
export { boostcms_continueissue4 as "boostCMS.continueIssue" }