/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Personalizesubtitle2Inputs */

const en_skillprofile_personalizesubtitle2 = /** @type {(inputs: Skillprofile_Personalizesubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personalize your pathways.`)
};

const es_skillprofile_personalizesubtitle2 = /** @type {(inputs: Skillprofile_Personalizesubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personaliza tus trayectorias.`)
};

const fr_skillprofile_personalizesubtitle2 = /** @type {(inputs: Skillprofile_Personalizesubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnalisez vos parcours.`)
};

const ar_skillprofile_personalizesubtitle2 = /** @type {(inputs: Skillprofile_Personalizesubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خصّص مساراتك.`)
};

/**
* | output |
* | --- |
* | "Personalize your pathways." |
*
* @param {Skillprofile_Personalizesubtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_personalizesubtitle2 = /** @type {((inputs?: Skillprofile_Personalizesubtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Personalizesubtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_personalizesubtitle2(inputs)
	if (locale === "es") return es_skillprofile_personalizesubtitle2(inputs)
	if (locale === "fr") return fr_skillprofile_personalizesubtitle2(inputs)
	return ar_skillprofile_personalizesubtitle2(inputs)
});
export { skillprofile_personalizesubtitle2 as "skillProfile.personalizeSubtitle" }