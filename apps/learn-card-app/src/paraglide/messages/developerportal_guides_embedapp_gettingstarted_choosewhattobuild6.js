/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Gettingstarted_Choosewhattobuild6Inputs */

const en_developerportal_guides_embedapp_gettingstarted_choosewhattobuild6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Choosewhattobuild6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choose What to Build`)
};

const es_developerportal_guides_embedapp_gettingstarted_choosewhattobuild6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Choosewhattobuild6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elige Qué Construir`)
};

const fr_developerportal_guides_embedapp_gettingstarted_choosewhattobuild6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Choosewhattobuild6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Choisir quoi Construire`)
};

const ar_developerportal_guides_embedapp_gettingstarted_choosewhattobuild6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Choosewhattobuild6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختر ما تريد بناءه`)
};

/**
* | output |
* | --- |
* | "Choose What to Build" |
*
* @param {Developerportal_Guides_Embedapp_Gettingstarted_Choosewhattobuild6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_gettingstarted_choosewhattobuild6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Gettingstarted_Choosewhattobuild6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Gettingstarted_Choosewhattobuild6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_gettingstarted_choosewhattobuild6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_gettingstarted_choosewhattobuild6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_gettingstarted_choosewhattobuild6(inputs)
	return ar_developerportal_guides_embedapp_gettingstarted_choosewhattobuild6(inputs)
});
export { developerportal_guides_embedapp_gettingstarted_choosewhattobuild6 as "developerPortal.guides.embedApp.gettingStarted.chooseWhatToBuild" }