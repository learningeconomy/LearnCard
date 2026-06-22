/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Integrationselector_Noprojectsyet4Inputs */

const en_developerportal_components_integrationselector_noprojectsyet4 = /** @type {(inputs: Developerportal_Components_Integrationselector_Noprojectsyet4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No projects yet. Create one to get started.`)
};

const es_developerportal_components_integrationselector_noprojectsyet4 = /** @type {(inputs: Developerportal_Components_Integrationselector_Noprojectsyet4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay proyectos. Crea uno para empezar.`)
};

const fr_developerportal_components_integrationselector_noprojectsyet4 = /** @type {(inputs: Developerportal_Components_Integrationselector_Noprojectsyet4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun projet pour l'instant. Créez-en un pour commencer.`)
};

const ar_developerportal_components_integrationselector_noprojectsyet4 = /** @type {(inputs: Developerportal_Components_Integrationselector_Noprojectsyet4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد مشاريع بعد. أنشئ واحداً للبدء.`)
};

/**
* | output |
* | --- |
* | "No projects yet. Create one to get started." |
*
* @param {Developerportal_Components_Integrationselector_Noprojectsyet4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_integrationselector_noprojectsyet4 = /** @type {((inputs?: Developerportal_Components_Integrationselector_Noprojectsyet4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Integrationselector_Noprojectsyet4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_integrationselector_noprojectsyet4(inputs)
	if (locale === "es") return es_developerportal_components_integrationselector_noprojectsyet4(inputs)
	if (locale === "fr") return fr_developerportal_components_integrationselector_noprojectsyet4(inputs)
	return ar_developerportal_components_integrationselector_noprojectsyet4(inputs)
});
export { developerportal_components_integrationselector_noprojectsyet4 as "developerPortal.components.integrationSelector.noProjectsYet" }