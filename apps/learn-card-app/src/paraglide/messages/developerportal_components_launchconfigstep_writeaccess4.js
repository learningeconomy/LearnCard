/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Launchconfigstep_Writeaccess4Inputs */

const en_developerportal_components_launchconfigstep_writeaccess4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Writeaccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Write Access`)
};

const es_developerportal_components_launchconfigstep_writeaccess4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Writeaccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acceso de Escritura`)
};

const fr_developerportal_components_launchconfigstep_writeaccess4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Writeaccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accès en Écriture`)
};

const ar_developerportal_components_launchconfigstep_writeaccess4 = /** @type {(inputs: Developerportal_Components_Launchconfigstep_Writeaccess4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`وصول للكتابة`)
};

/**
* | output |
* | --- |
* | "Write Access" |
*
* @param {Developerportal_Components_Launchconfigstep_Writeaccess4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_launchconfigstep_writeaccess4 = /** @type {((inputs?: Developerportal_Components_Launchconfigstep_Writeaccess4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Launchconfigstep_Writeaccess4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_launchconfigstep_writeaccess4(inputs)
	if (locale === "es") return es_developerportal_components_launchconfigstep_writeaccess4(inputs)
	if (locale === "fr") return fr_developerportal_components_launchconfigstep_writeaccess4(inputs)
	return ar_developerportal_components_launchconfigstep_writeaccess4(inputs)
});
export { developerportal_components_launchconfigstep_writeaccess4 as "developerPortal.components.launchConfigStep.writeAccess" }