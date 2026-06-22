/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Launchcategories_Notifications3Inputs */

const en_developerportal_guides_embedapp_launchcategories_notifications3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Notifications3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notifications`)
};

const es_developerportal_guides_embedapp_launchcategories_notifications3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Notifications3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notificaciones`)
};

const fr_developerportal_guides_embedapp_launchcategories_notifications3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Notifications3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notifications`)
};

const ar_developerportal_guides_embedapp_launchcategories_notifications3 = /** @type {(inputs: Developerportal_Guides_Embedapp_Launchcategories_Notifications3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الإشعارات`)
};

/**
* | output |
* | --- |
* | "Notifications" |
*
* @param {Developerportal_Guides_Embedapp_Launchcategories_Notifications3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_launchcategories_notifications3 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Launchcategories_Notifications3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Launchcategories_Notifications3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_launchcategories_notifications3(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_launchcategories_notifications3(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_launchcategories_notifications3(inputs)
	return ar_developerportal_guides_embedapp_launchcategories_notifications3(inputs)
});
export { developerportal_guides_embedapp_launchcategories_notifications3 as "developerPortal.guides.embedApp.launchCategories.notifications" }