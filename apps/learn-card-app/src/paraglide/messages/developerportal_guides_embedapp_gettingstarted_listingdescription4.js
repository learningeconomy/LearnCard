/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Gettingstarted_Listingdescription4Inputs */

const en_developerportal_guides_embedapp_gettingstarted_listingdescription4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Listingdescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app listing is what users see in the LearnCard app store.`)
};

const es_developerportal_guides_embedapp_gettingstarted_listingdescription4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Listingdescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`El listado de tu aplicación es lo que los usuarios ven en la tienda de LearnCard.`)
};

const fr_developerportal_guides_embedapp_gettingstarted_listingdescription4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Listingdescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app listing is what users see in the LearnCard app store.`)
};

const ar_developerportal_guides_embedapp_gettingstarted_listingdescription4 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Listingdescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your app listing is what users see in the LearnCard app store.`)
};

/**
* | output |
* | --- |
* | "Your app listing is what users see in the LearnCard app store." |
*
* @param {Developerportal_Guides_Embedapp_Gettingstarted_Listingdescription4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_gettingstarted_listingdescription4 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Gettingstarted_Listingdescription4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Gettingstarted_Listingdescription4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_gettingstarted_listingdescription4(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_gettingstarted_listingdescription4(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_gettingstarted_listingdescription4(inputs)
	return ar_developerportal_guides_embedapp_gettingstarted_listingdescription4(inputs)
});
export { developerportal_guides_embedapp_gettingstarted_listingdescription4 as "developerPortal.guides.embedApp.gettingStarted.listingDescription" }