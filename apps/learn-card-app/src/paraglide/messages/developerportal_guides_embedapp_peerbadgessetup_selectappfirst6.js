/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Guides_Embedapp_Peerbadgessetup_Selectappfirst6Inputs */

const en_developerportal_guides_embedapp_peerbadgessetup_selectappfirst6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Selectappfirst6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please go back to Step 1 and select an app listing first.`)
};

const es_developerportal_guides_embedapp_peerbadgessetup_selectappfirst6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Selectappfirst6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por favor vuelve al Paso 1 y selecciona un listado de app primero.`)
};

const fr_developerportal_guides_embedapp_peerbadgessetup_selectappfirst6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Selectappfirst6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please go back to Step 1 and select an app listing first.`)
};

const ar_developerportal_guides_embedapp_peerbadgessetup_selectappfirst6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Selectappfirst6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Please go back to Step 1 and select an app listing first.`)
};

/**
* | output |
* | --- |
* | "Please go back to Step 1 and select an app listing first." |
*
* @param {Developerportal_Guides_Embedapp_Peerbadgessetup_Selectappfirst6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_peerbadgessetup_selectappfirst6 = /** @type {((inputs?: Developerportal_Guides_Embedapp_Peerbadgessetup_Selectappfirst6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Peerbadgessetup_Selectappfirst6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_peerbadgessetup_selectappfirst6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_peerbadgessetup_selectappfirst6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_peerbadgessetup_selectappfirst6(inputs)
	return ar_developerportal_guides_embedapp_peerbadgessetup_selectappfirst6(inputs)
});
export { developerportal_guides_embedapp_peerbadgessetup_selectappfirst6 as "developerPortal.guides.embedApp.peerBadgesSetup.selectAppFirst" }