/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Gettingstarted_Thatisit5Inputs */

const en_developerportal_guides_embedapp_gettingstarted_thatisit5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Thatisit5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`That's it!`)
};

const es_developerportal_guides_embedapp_gettingstarted_thatisit5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Thatisit5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Eso es todo!`)
};

const fr_developerportal_guides_embedapp_gettingstarted_thatisit5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Thatisit5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`C'est tout !`)
};

const ar_developerportal_guides_embedapp_gettingstarted_thatisit5 = /** @type {(inputs: Developerportal_Guides_Embedapp_Gettingstarted_Thatisit5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هذا كل شيء!`)
};

/**
* | output |
* | --- |
* | "That's it!" |
*
* @param {Developerportal_Guides_Embedapp_Gettingstarted_Thatisit5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_gettingstarted_thatisit5 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Gettingstarted_Thatisit5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Gettingstarted_Thatisit5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_gettingstarted_thatisit5(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_gettingstarted_thatisit5(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_gettingstarted_thatisit5(inputs)
	return ar_developerportal_guides_embedapp_gettingstarted_thatisit5(inputs)
});
export { developerportal_guides_embedapp_gettingstarted_thatisit5 as "developerPortal.guides.embedApp.gettingStarted.thatIsIt" }