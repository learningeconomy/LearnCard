/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Generateclaimlink5Inputs */

const en_boostcms_generateclaimlink5 = /** @type {(inputs: Boostcms_Generateclaimlink5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate Claim Link?`)
};

const es_boostcms_generateclaimlink5 = /** @type {(inputs: Boostcms_Generateclaimlink5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Generar Enlace de Reclamo?`)
};

const fr_boostcms_generateclaimlink5 = /** @type {(inputs: Boostcms_Generateclaimlink5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générer un lien de réclamation ?`)
};

const ar_boostcms_generateclaimlink5 = /** @type {(inputs: Boostcms_Generateclaimlink5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate Claim Link?`)
};

/**
* | output |
* | --- |
* | "Generate Claim Link?" |
*
* @param {Boostcms_Generateclaimlink5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_generateclaimlink5 = /** @type {((inputs?: Boostcms_Generateclaimlink5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Generateclaimlink5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_generateclaimlink5(inputs)
	if (locale === "es") return es_boostcms_generateclaimlink5(inputs)
	if (locale === "fr") return fr_boostcms_generateclaimlink5(inputs)
	return ar_boostcms_generateclaimlink5(inputs)
});
export { boostcms_generateclaimlink5 as "boostCMS.generateClaimLink" }