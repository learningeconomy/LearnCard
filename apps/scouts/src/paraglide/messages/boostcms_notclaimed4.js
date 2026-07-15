/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Notclaimed4Inputs */

const en_boostcms_notclaimed4 = /** @type {(inputs: Boostcms_Notclaimed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Not yet claimed.`)
};

const es_boostcms_notclaimed4 = /** @type {(inputs: Boostcms_Notclaimed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no reclamado.`)
};

const fr_boostcms_notclaimed4 = /** @type {(inputs: Boostcms_Notclaimed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas encore réclamé.`)
};

const ar_boostcms_notclaimed4 = /** @type {(inputs: Boostcms_Notclaimed4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لم يتم استلامه بعد.`)
};

/**
* | output |
* | --- |
* | "Not yet claimed." |
*
* @param {Boostcms_Notclaimed4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_notclaimed4 = /** @type {((inputs?: Boostcms_Notclaimed4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Notclaimed4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_notclaimed4(inputs)
	if (locale === "es") return es_boostcms_notclaimed4(inputs)
	if (locale === "fr") return fr_boostcms_notclaimed4(inputs)
	return ar_boostcms_notclaimed4(inputs)
});
export { boostcms_notclaimed4 as "boostCMS.notClaimed" }