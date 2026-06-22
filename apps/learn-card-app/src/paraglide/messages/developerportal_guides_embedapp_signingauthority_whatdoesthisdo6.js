/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Signingauthority_Whatdoesthisdo6Inputs */

const en_developerportal_guides_embedapp_signingauthority_whatdoesthisdo6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Whatdoesthisdo6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`What does this do?`)
};

const es_developerportal_guides_embedapp_signingauthority_whatdoesthisdo6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Whatdoesthisdo6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Qué hace esto?`)
};

const fr_developerportal_guides_embedapp_signingauthority_whatdoesthisdo6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Whatdoesthisdo6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Qu'est-ce que ça fait ?`)
};

const ar_developerportal_guides_embedapp_signingauthority_whatdoesthisdo6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Signingauthority_Whatdoesthisdo6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ماذا يفعل هذا؟`)
};

/**
* | output |
* | --- |
* | "What does this do?" |
*
* @param {Developerportal_Guides_Embedapp_Signingauthority_Whatdoesthisdo6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_signingauthority_whatdoesthisdo6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Signingauthority_Whatdoesthisdo6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Signingauthority_Whatdoesthisdo6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_signingauthority_whatdoesthisdo6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_signingauthority_whatdoesthisdo6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_signingauthority_whatdoesthisdo6(inputs)
	return ar_developerportal_guides_embedapp_signingauthority_whatdoesthisdo6(inputs)
});
export { developerportal_guides_embedapp_signingauthority_whatdoesthisdo6 as "developerPortal.guides.embedApp.signingAuthority.whatDoesThisDo" }