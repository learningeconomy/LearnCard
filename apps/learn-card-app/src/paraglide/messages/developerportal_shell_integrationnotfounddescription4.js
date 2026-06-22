/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Integrationnotfounddescription4Inputs */

const en_developerportal_shell_integrationnotfounddescription4 = /** @type {(inputs: Developerportal_Shell_Integrationnotfounddescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`The integration you're looking for doesn't exist or you don't have access to it.`)
};

const es_developerportal_shell_integrationnotfounddescription4 = /** @type {(inputs: Developerportal_Shell_Integrationnotfounddescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`La integración que buscas no existe o no tienes acceso a ella.`)
};

const fr_developerportal_shell_integrationnotfounddescription4 = /** @type {(inputs: Developerportal_Shell_Integrationnotfounddescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'intégration que vous cherchez n'existe pas ou vous n'y avez pas accès.`)
};

const ar_developerportal_shell_integrationnotfounddescription4 = /** @type {(inputs: Developerportal_Shell_Integrationnotfounddescription4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التكامل الذي تبحث عنه غير موجود أو ليس لديك صلاحية الوصول إليه.`)
};

/**
* | output |
* | --- |
* | "The integration you're looking for doesn't exist or you don't have access to it." |
*
* @param {Developerportal_Shell_Integrationnotfounddescription4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_integrationnotfounddescription4 = /** @type {((inputs?: Developerportal_Shell_Integrationnotfounddescription4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Integrationnotfounddescription4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_integrationnotfounddescription4(inputs)
	if (locale === "es") return es_developerportal_shell_integrationnotfounddescription4(inputs)
	if (locale === "fr") return fr_developerportal_shell_integrationnotfounddescription4(inputs)
	return ar_developerportal_shell_integrationnotfounddescription4(inputs)
});
export { developerportal_shell_integrationnotfounddescription4 as "developerPortal.shell.integrationNotFoundDescription" }