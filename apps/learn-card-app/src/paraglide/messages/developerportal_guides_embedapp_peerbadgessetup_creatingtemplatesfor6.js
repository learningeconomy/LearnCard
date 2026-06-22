/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown> }} Developerportal_Guides_Embedapp_Peerbadgessetup_Creatingtemplatesfor6Inputs */

const en_developerportal_guides_embedapp_peerbadgessetup_creatingtemplatesfor6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Creatingtemplatesfor6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Creating templates for: ${i?.name}`)
};

const es_developerportal_guides_embedapp_peerbadgessetup_creatingtemplatesfor6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Creatingtemplatesfor6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Creating templates for: ${i?.name}`)
};

const fr_developerportal_guides_embedapp_peerbadgessetup_creatingtemplatesfor6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Creatingtemplatesfor6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Creating templates for: ${i?.name}`)
};

const ar_developerportal_guides_embedapp_peerbadgessetup_creatingtemplatesfor6 = /** @type {(inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Creatingtemplatesfor6Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Creating templates for: ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Creating templates for: {name}" |
*
* @param {Developerportal_Guides_Embedapp_Peerbadgessetup_Creatingtemplatesfor6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_guides_embedapp_peerbadgessetup_creatingtemplatesfor6 = /** @type {((inputs: Developerportal_Guides_Embedapp_Peerbadgessetup_Creatingtemplatesfor6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Guides_Embedapp_Peerbadgessetup_Creatingtemplatesfor6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_guides_embedapp_peerbadgessetup_creatingtemplatesfor6(inputs)
	if (locale === "es") return es_developerportal_guides_embedapp_peerbadgessetup_creatingtemplatesfor6(inputs)
	if (locale === "fr") return fr_developerportal_guides_embedapp_peerbadgessetup_creatingtemplatesfor6(inputs)
	return ar_developerportal_guides_embedapp_peerbadgessetup_creatingtemplatesfor6(inputs)
});
export { developerportal_guides_embedapp_peerbadgessetup_creatingtemplatesfor6 as "developerPortal.guides.embedApp.peerBadgesSetup.creatingTemplatesFor" }