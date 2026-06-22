/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Betagate_Betaaccessrequired4Inputs */

const en_developerportal_components_betagate_betaaccessrequired4 = /** @type {(inputs: Developerportal_Components_Betagate_Betaaccessrequired4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beta Access Required`)
};

const es_developerportal_components_betagate_betaaccessrequired4 = /** @type {(inputs: Developerportal_Components_Betagate_Betaaccessrequired4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceso Beta Requerido`)
};

const fr_developerportal_components_betagate_betaaccessrequired4 = /** @type {(inputs: Developerportal_Components_Betagate_Betaaccessrequired4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accès Beta Requis`)
};

const ar_developerportal_components_betagate_betaaccessrequired4 = /** @type {(inputs: Developerportal_Components_Betagate_Betaaccessrequired4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مطلوب وصول تجريبي`)
};

/**
* | output |
* | --- |
* | "Beta Access Required" |
*
* @param {Developerportal_Components_Betagate_Betaaccessrequired4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_betagate_betaaccessrequired4 = /** @type {((inputs?: Developerportal_Components_Betagate_Betaaccessrequired4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Betagate_Betaaccessrequired4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_betagate_betaaccessrequired4(inputs)
	if (locale === "es") return es_developerportal_components_betagate_betaaccessrequired4(inputs)
	if (locale === "fr") return fr_developerportal_components_betagate_betaaccessrequired4(inputs)
	return ar_developerportal_components_betagate_betaaccessrequired4(inputs)
});
export { developerportal_components_betagate_betaaccessrequired4 as "developerPortal.components.betaGate.betaAccessRequired" }