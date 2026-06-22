/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Shell_Emptyintegrationsdescription3Inputs */

const en_developerportal_shell_emptyintegrationsdescription3 = /** @type {(inputs: Developerportal_Shell_Emptyintegrationsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Set up an integration to start issuing verifiable credentials from your platform. We'll guide you through every step.`)
};

const es_developerportal_shell_emptyintegrationsdescription3 = /** @type {(inputs: Developerportal_Shell_Emptyintegrationsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configura una integración para empezar a emitir credenciales verificables desde tu plataforma. Te guiaremos en cada paso.`)
};

const fr_developerportal_shell_emptyintegrationsdescription3 = /** @type {(inputs: Developerportal_Shell_Emptyintegrationsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Configurez une intégration pour commencer à émettre des certificats vérifiables depuis votre plateforme. Nous vous guiderons à chaque étape.`)
};

const ar_developerportal_shell_emptyintegrationsdescription3 = /** @type {(inputs: Developerportal_Shell_Emptyintegrationsdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قم بإعداد تكامل لبدء إصدار بيانات اعتماد قابلة للتحقق من منصتك. سنرشدك خلال كل خطوة.`)
};

/**
* | output |
* | --- |
* | "Set up an integration to start issuing verifiable credentials from your platform. We'll guide you through every step." |
*
* @param {Developerportal_Shell_Emptyintegrationsdescription3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_shell_emptyintegrationsdescription3 = /** @type {((inputs?: Developerportal_Shell_Emptyintegrationsdescription3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Shell_Emptyintegrationsdescription3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_shell_emptyintegrationsdescription3(inputs)
	if (locale === "es") return es_developerportal_shell_emptyintegrationsdescription3(inputs)
	if (locale === "fr") return fr_developerportal_shell_emptyintegrationsdescription3(inputs)
	return ar_developerportal_shell_emptyintegrationsdescription3(inputs)
});
export { developerportal_shell_emptyintegrationsdescription3 as "developerPortal.shell.emptyIntegrationsDescription" }