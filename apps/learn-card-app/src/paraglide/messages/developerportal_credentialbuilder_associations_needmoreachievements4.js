/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Associations_Needmoreachievements4Inputs */

const en_developerportal_credentialbuilder_associations_needmoreachievements4 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Needmoreachievements4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add at least two achievements to create associations between them.`)
};

const es_developerportal_credentialbuilder_associations_needmoreachievements4 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Needmoreachievements4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Añade al menos dos logros para crear asociaciones entre ellos.`)
};

const fr_developerportal_credentialbuilder_associations_needmoreachievements4 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Needmoreachievements4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajoutez au moins deux réalisations pour créer des associations entre elles.`)
};

const ar_developerportal_credentialbuilder_associations_needmoreachievements4 = /** @type {(inputs: Developerportal_Credentialbuilder_Associations_Needmoreachievements4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أضف إنجازين على الأقل لإنشاء ارتباطات بينهما.`)
};

/**
* | output |
* | --- |
* | "Add at least two achievements to create associations between them." |
*
* @param {Developerportal_Credentialbuilder_Associations_Needmoreachievements4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_associations_needmoreachievements4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Associations_Needmoreachievements4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Associations_Needmoreachievements4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_associations_needmoreachievements4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_associations_needmoreachievements4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_associations_needmoreachievements4(inputs)
	return ar_developerportal_credentialbuilder_associations_needmoreachievements4(inputs)
});
export { developerportal_credentialbuilder_associations_needmoreachievements4 as "developerPortal.credentialBuilder.associations.needMoreAchievements" }