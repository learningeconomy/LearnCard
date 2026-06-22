/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Accountupgradedesc2Inputs */

const en_recovery_accountupgradedesc2 = /** @type {(inputs: Recovery_Accountupgradedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`We're upgrading your account security but couldn't finish automatically. Please try again.`)
};

const es_recovery_accountupgradedesc2 = /** @type {(inputs: Recovery_Accountupgradedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estamos actualizando la seguridad de tu cuenta pero no pudimos terminar automáticamente. Intenta de nuevo.`)
};

const fr_recovery_accountupgradedesc2 = /** @type {(inputs: Recovery_Accountupgradedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nous mettons à niveau la sécurité de votre compte mais n'avons pas pu terminer automatiquement. Veuillez réessayer.`)
};

const ar_recovery_accountupgradedesc2 = /** @type {(inputs: Recovery_Accountupgradedesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نحن نقوم بترقية أمان حسابك ولكن لم نتمكن من الانتهاء تلقائيًا. يرجى المحاولة مرة أخرى.`)
};

/**
* | output |
* | --- |
* | "We're upgrading your account security but couldn't finish automatically. Please try again." |
*
* @param {Recovery_Accountupgradedesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_accountupgradedesc2 = /** @type {((inputs?: Recovery_Accountupgradedesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Accountupgradedesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_accountupgradedesc2(inputs)
	if (locale === "es") return es_recovery_accountupgradedesc2(inputs)
	if (locale === "fr") return fr_recovery_accountupgradedesc2(inputs)
	return ar_recovery_accountupgradedesc2(inputs)
});
export { recovery_accountupgradedesc2 as "recovery.accountUpgradeDesc" }