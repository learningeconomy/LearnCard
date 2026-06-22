/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Golive_Completeditems_Applistingcreated6Inputs */

const en_developerportal_guides_embedapp_golive_completeditems_applistingcreated6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Golive_Completeditems_Applistingcreated6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App listing created`)
};

const es_developerportal_guides_embedapp_golive_completeditems_applistingcreated6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Golive_Completeditems_Applistingcreated6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App listing created`)
};

const fr_developerportal_guides_embedapp_golive_completeditems_applistingcreated6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Golive_Completeditems_Applistingcreated6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App listing created`)
};

const ar_developerportal_guides_embedapp_golive_completeditems_applistingcreated6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Golive_Completeditems_Applistingcreated6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App listing created`)
};

/**
* | output |
* | --- |
* | "App listing created" |
*
* @param {Developerportal_Guides_Embedapp_Golive_Completeditems_Applistingcreated6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_golive_completeditems_applistingcreated6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Golive_Completeditems_Applistingcreated6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Golive_Completeditems_Applistingcreated6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_golive_completeditems_applistingcreated6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_golive_completeditems_applistingcreated6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_golive_completeditems_applistingcreated6(inputs)
	return ar_developerportal_guides_embedapp_golive_completeditems_applistingcreated6(inputs)
});
export { developerportal_guides_embedapp_golive_completeditems_applistingcreated6 as "developerPortal.guides.embedApp.goLive.completedItems.appListingCreated" }