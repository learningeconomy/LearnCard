/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Generatingclaimlink5Inputs */

const en_boostcms_generatingclaimlink5 = /** @type {(inputs: Boostcms_Generatingclaimlink5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generating claim link...`)
};

const es_boostcms_generatingclaimlink5 = /** @type {(inputs: Boostcms_Generatingclaimlink5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generando enlace de reclamo...`)
};

const fr_boostcms_generatingclaimlink5 = /** @type {(inputs: Boostcms_Generatingclaimlink5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Génération du lien de réclamation...`)
};

const ar_boostcms_generatingclaimlink5 = /** @type {(inputs: Boostcms_Generatingclaimlink5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generating claim link...`)
};

/**
* | output |
* | --- |
* | "Generating claim link..." |
*
* @param {Boostcms_Generatingclaimlink5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_generatingclaimlink5 = /** @type {((inputs?: Boostcms_Generatingclaimlink5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Generatingclaimlink5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_generatingclaimlink5(inputs)
	if (locale === "es") return es_boostcms_generatingclaimlink5(inputs)
	if (locale === "fr") return fr_boostcms_generatingclaimlink5(inputs)
	return ar_boostcms_generatingclaimlink5(inputs)
});
export { boostcms_generatingclaimlink5 as "boostCMS.generatingClaimLink" }