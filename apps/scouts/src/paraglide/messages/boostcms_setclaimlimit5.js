/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Setclaimlimit5Inputs */

const en_boostcms_setclaimlimit5 = /** @type {(inputs: Boostcms_Setclaimlimit5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set Claim Limit?`)
};

const es_boostcms_setclaimlimit5 = /** @type {(inputs: Boostcms_Setclaimlimit5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Establecer Límite de Reclamo?`)
};

const fr_boostcms_setclaimlimit5 = /** @type {(inputs: Boostcms_Setclaimlimit5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Définir une limite de réclamations ?`)
};

const ar_boostcms_setclaimlimit5 = /** @type {(inputs: Boostcms_Setclaimlimit5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set Claim Limit?`)
};

/**
* | output |
* | --- |
* | "Set Claim Limit?" |
*
* @param {Boostcms_Setclaimlimit5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_setclaimlimit5 = /** @type {((inputs?: Boostcms_Setclaimlimit5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Setclaimlimit5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_setclaimlimit5(inputs)
	if (locale === "es") return es_boostcms_setclaimlimit5(inputs)
	if (locale === "fr") return fr_boostcms_setclaimlimit5(inputs)
	return ar_boostcms_setclaimlimit5(inputs)
});
export { boostcms_setclaimlimit5 as "boostCMS.setClaimLimit" }