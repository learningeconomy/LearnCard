/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Golive_Completeditems_Sdkinstalled5Inputs */

const en_developerportal_guides_embedapp_golive_completeditems_sdkinstalled5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Golive_Completeditems_Sdkinstalled5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SDK installed and configured`)
};

const es_developerportal_guides_embedapp_golive_completeditems_sdkinstalled5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Golive_Completeditems_Sdkinstalled5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SDK installed and configured`)
};

const fr_developerportal_guides_embedapp_golive_completeditems_sdkinstalled5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Golive_Completeditems_Sdkinstalled5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SDK installed and configured`)
};

const ar_developerportal_guides_embedapp_golive_completeditems_sdkinstalled5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Golive_Completeditems_Sdkinstalled5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`SDK installed and configured`)
};

/**
* | output |
* | --- |
* | "SDK installed and configured" |
*
* @param {Developerportal_Guides_Embedapp_Golive_Completeditems_Sdkinstalled5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_golive_completeditems_sdkinstalled5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Golive_Completeditems_Sdkinstalled5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Golive_Completeditems_Sdkinstalled5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_golive_completeditems_sdkinstalled5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_golive_completeditems_sdkinstalled5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_golive_completeditems_sdkinstalled5(inputs)
	return ar_developerportal_guides_embedapp_golive_completeditems_sdkinstalled5(inputs)
});
export { developerportal_guides_embedapp_golive_completeditems_sdkinstalled5 as "developerPortal.guides.embedApp.goLive.completedItems.sdkInstalled" }