/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Welcomedesc3Inputs */

const en_developerportal_components_betagate_welcomedesc3 = /** @type {(inputs: Developerportal_Components_Betagate_Welcomedesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You're previewing new developer tools before they're publicly available.`)
};

const es_developerportal_components_betagate_welcomedesc3 = /** @type {(inputs: Developerportal_Components_Betagate_Welcomedesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estás viendo en vista previa nuevas herramientas para desarrolladores antes de que estén disponibles públicamente.`)
};

const fr_developerportal_components_betagate_welcomedesc3 = /** @type {(inputs: Developerportal_Components_Betagate_Welcomedesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous prévisualisez de nouveaux outils développeur avant leur disponibilité publique.`)
};

const ar_developerportal_components_betagate_welcomedesc3 = /** @type {(inputs: Developerportal_Components_Betagate_Welcomedesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنت تتصفح أدوات مطور جديدة قبل أن تصبح متاحة للجمهور.`)
};

/**
* | output |
* | --- |
* | "You're previewing new developer tools before they're publicly available." |
*
* @param {Developerportal_Components_Betagate_Welcomedesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_welcomedesc3 = /** @type {((inputs?: Developerportal_Components_Betagate_Welcomedesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Welcomedesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_welcomedesc3(inputs)
	if (locale === "es") return es_developerportal_components_betagate_welcomedesc3(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_welcomedesc3(inputs)
	return ar_developerportal_components_betagate_welcomedesc3(inputs)
});
export { developerportal_components_betagate_welcomedesc3 as "developerPortal.components.betaGate.welcomeDesc" }