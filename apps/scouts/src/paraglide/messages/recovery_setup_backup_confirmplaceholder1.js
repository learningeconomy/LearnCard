/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Backup_Confirmplaceholder1Inputs */

const en_recovery_setup_backup_confirmplaceholder1 = /** @type {(inputs: Recovery_Setup_Backup_Confirmplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type it again`)
};

const es_recovery_setup_backup_confirmplaceholder1 = /** @type {(inputs: Recovery_Setup_Backup_Confirmplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escríbela de nuevo`)
};

const fr_recovery_setup_backup_confirmplaceholder1 = /** @type {(inputs: Recovery_Setup_Backup_Confirmplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tapez-le à nouveau`)
};

const ar_recovery_setup_backup_confirmplaceholder1 = /** @type {(inputs: Recovery_Setup_Backup_Confirmplaceholder1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Type it again`)
};

/**
* | output |
* | --- |
* | "Type it again" |
*
* @param {Recovery_Setup_Backup_Confirmplaceholder1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_backup_confirmplaceholder1 = /** @type {((inputs?: Recovery_Setup_Backup_Confirmplaceholder1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Backup_Confirmplaceholder1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_backup_confirmplaceholder1(inputs)
	if (locale === "es") return es_recovery_setup_backup_confirmplaceholder1(inputs)
	if (locale === "fr") return fr_recovery_setup_backup_confirmplaceholder1(inputs)
	return ar_recovery_setup_backup_confirmplaceholder1(inputs)
});
export { recovery_setup_backup_confirmplaceholder1 as "recovery.setup.backup.confirmPlaceholder" }