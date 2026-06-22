/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Issueto_Generateclaimlink3Inputs */

const en_boost_cms_issueto_generateclaimlink3 = /** @type {(inputs: Boost_Cms_Issueto_Generateclaimlink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate Claim Link?`)
};

const es_boost_cms_issueto_generateclaimlink3 = /** @type {(inputs: Boost_Cms_Issueto_Generateclaimlink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Generar enlace de reclamación?`)
};

const fr_boost_cms_issueto_generateclaimlink3 = /** @type {(inputs: Boost_Cms_Issueto_Generateclaimlink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générer un lien de réclamation ?`)
};

const ar_boost_cms_issueto_generateclaimlink3 = /** @type {(inputs: Boost_Cms_Issueto_Generateclaimlink3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`توليد رابط مطالبة؟`)
};

/**
* | output |
* | --- |
* | "Generate Claim Link?" |
*
* @param {Boost_Cms_Issueto_Generateclaimlink3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_issueto_generateclaimlink3 = /** @type {((inputs?: Boost_Cms_Issueto_Generateclaimlink3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Issueto_Generateclaimlink3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_issueto_generateclaimlink3(inputs)
	if (locale === "es") return es_boost_cms_issueto_generateclaimlink3(inputs)
	if (locale === "fr") return fr_boost_cms_issueto_generateclaimlink3(inputs)
	return ar_boost_cms_issueto_generateclaimlink3(inputs)
});
export { boost_cms_issueto_generateclaimlink3 as "boost.cms.issueTo.generateClaimLink" }