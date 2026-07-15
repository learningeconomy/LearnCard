/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Tabpasskey1Inputs */

const en_recovery_setup_tabpasskey1 = /** @type {(inputs: Recovery_Setup_Tabpasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkey`)
};

const es_recovery_setup_tabpasskey1 = /** @type {(inputs: Recovery_Setup_Tabpasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkey`)
};

const fr_recovery_setup_tabpasskey1 = /** @type {(inputs: Recovery_Setup_Tabpasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé d'accès`)
};

const ar_recovery_setup_tabpasskey1 = /** @type {(inputs: Recovery_Setup_Tabpasskey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkey`)
};

/**
* | output |
* | --- |
* | "Passkey" |
*
* @param {Recovery_Setup_Tabpasskey1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_tabpasskey1 = /** @type {((inputs?: Recovery_Setup_Tabpasskey1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Tabpasskey1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_tabpasskey1(inputs)
	if (locale === "es") return es_recovery_setup_tabpasskey1(inputs)
	if (locale === "fr") return fr_recovery_setup_tabpasskey1(inputs)
	return ar_recovery_setup_tabpasskey1(inputs)
});
export { recovery_setup_tabpasskey1 as "recovery.setup.tabPasskey" }