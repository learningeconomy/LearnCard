/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Generatenewbackup2Inputs */

const en_recovery_generatenewbackup2 = /** @type {(inputs: Recovery_Generatenewbackup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This will generate a new backup file. Your previous backup file will no longer work.`)
};

const es_recovery_generatenewbackup2 = /** @type {(inputs: Recovery_Generatenewbackup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esto generará un nuevo archivo de respaldo. Tu archivo anterior ya no funcionará.`)
};

const fr_recovery_generatenewbackup2 = /** @type {(inputs: Recovery_Generatenewbackup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cela générera un nouveau fichier de sauvegarde. Votre fichier précédent ne fonctionnera plus.`)
};

const ar_recovery_generatenewbackup2 = /** @type {(inputs: Recovery_Generatenewbackup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيؤدي هذا إلى إنشاء ملف نسخ احتياطي جديد. ملفك السابق لن يعمل بعد الآن.`)
};

/**
* | output |
* | --- |
* | "This will generate a new backup file. Your previous backup file will no longer work." |
*
* @param {Recovery_Generatenewbackup2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_generatenewbackup2 = /** @type {((inputs?: Recovery_Generatenewbackup2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Generatenewbackup2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_generatenewbackup2(inputs)
	if (locale === "es") return es_recovery_generatenewbackup2(inputs)
	if (locale === "fr") return fr_recovery_generatenewbackup2(inputs)
	return ar_recovery_generatenewbackup2(inputs)
});
export { recovery_generatenewbackup2 as "recovery.generateNewBackup" }