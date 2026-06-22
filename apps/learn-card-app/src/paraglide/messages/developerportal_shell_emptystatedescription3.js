/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Emptystatedescription3Inputs */

const en_developerportal_shell_emptystatedescription3 = /** @type {(inputs: Developerportal_Shell_Emptystatedescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share your app with thousands of users. Create a project to get started.`)
};

const es_developerportal_shell_emptystatedescription3 = /** @type {(inputs: Developerportal_Shell_Emptystatedescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Comparte tu app con miles de usuarios. Crea un proyecto para empezar.`)
};

const fr_developerportal_shell_emptystatedescription3 = /** @type {(inputs: Developerportal_Shell_Emptystatedescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partagez votre application avec des milliers d'utilisateurs. Créez un projet pour commencer.`)
};

const ar_developerportal_shell_emptystatedescription3 = /** @type {(inputs: Developerportal_Shell_Emptystatedescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شارك تطبيقك مع آلاف المستخدمين. أنشئ مشروعاً للبدء.`)
};

/**
* | output |
* | --- |
* | "Share your app with thousands of users. Create a project to get started." |
*
* @param {Developerportal_Shell_Emptystatedescription3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_emptystatedescription3 = /** @type {((inputs?: Developerportal_Shell_Emptystatedescription3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Emptystatedescription3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_emptystatedescription3(inputs)
	if (locale === "es") return es_developerportal_shell_emptystatedescription3(inputs)
	if (locale === "fr") return fr_developerportal_shell_emptystatedescription3(inputs)
	return ar_developerportal_shell_emptystatedescription3(inputs)
});
export { developerportal_shell_emptystatedescription3 as "developerPortal.shell.emptyStateDescription" }