/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Allintegrationguides4Inputs */

const en_developerportal_components_betagate_allintegrationguides4 = /** @type {(inputs: Developerportal_Components_Betagate_Allintegrationguides4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All integration guides`)
};

const es_developerportal_components_betagate_allintegrationguides4 = /** @type {(inputs: Developerportal_Components_Betagate_Allintegrationguides4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todas las guías de integración`)
};

const fr_developerportal_components_betagate_allintegrationguides4 = /** @type {(inputs: Developerportal_Components_Betagate_Allintegrationguides4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tous les guides d'intégration`)
};

const ar_developerportal_components_betagate_allintegrationguides4 = /** @type {(inputs: Developerportal_Components_Betagate_Allintegrationguides4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جميع أدلة التكامل`)
};

/**
* | output |
* | --- |
* | "All integration guides" |
*
* @param {Developerportal_Components_Betagate_Allintegrationguides4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_allintegrationguides4 = /** @type {((inputs?: Developerportal_Components_Betagate_Allintegrationguides4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Allintegrationguides4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_allintegrationguides4(inputs)
	if (locale === "es") return es_developerportal_components_betagate_allintegrationguides4(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_allintegrationguides4(inputs)
	return ar_developerportal_components_betagate_allintegrationguides4(inputs)
});
export { developerportal_components_betagate_allintegrationguides4 as "developerPortal.components.betaGate.allIntegrationGuides" }