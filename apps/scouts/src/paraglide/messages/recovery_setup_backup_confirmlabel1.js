/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Setup_Backup_Confirmlabel1Inputs */

const en_recovery_setup_backup_confirmlabel1 = /** @type {(inputs: Recovery_Setup_Backup_Confirmlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirm Password`)
};

const es_recovery_setup_backup_confirmlabel1 = /** @type {(inputs: Recovery_Setup_Backup_Confirmlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmar Contraseña`)
};

const fr_recovery_setup_backup_confirmlabel1 = /** @type {(inputs: Recovery_Setup_Backup_Confirmlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmer le mot de passe`)
};

const ar_recovery_setup_backup_confirmlabel1 = /** @type {(inputs: Recovery_Setup_Backup_Confirmlabel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تأكيد كلمة المرور`)
};

/**
* | output |
* | --- |
* | "Confirm Password" |
*
* @param {Recovery_Setup_Backup_Confirmlabel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_setup_backup_confirmlabel1 = /** @type {((inputs?: Recovery_Setup_Backup_Confirmlabel1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Setup_Backup_Confirmlabel1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_setup_backup_confirmlabel1(inputs)
	if (locale === "es") return es_recovery_setup_backup_confirmlabel1(inputs)
	if (locale === "fr") return fr_recovery_setup_backup_confirmlabel1(inputs)
	return ar_recovery_setup_backup_confirmlabel1(inputs)
});
export { recovery_setup_backup_confirmlabel1 as "recovery.setup.backup.confirmLabel" }