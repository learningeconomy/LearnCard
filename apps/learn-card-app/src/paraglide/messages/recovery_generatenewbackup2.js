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

const de_recovery_generatenewbackup2 = /** @type {(inputs: Recovery_Generatenewbackup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dadurch wird eine neue Sicherungsdatei generiert. Deine vorherige Datei funktioniert nicht mehr.`)
};

const ar_recovery_generatenewbackup2 = /** @type {(inputs: Recovery_Generatenewbackup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيؤدي هذا إلى إنشاء ملف نسخ احتياطي جديد. ملفك السابق لن يعمل بعد الآن.`)
};

const fr_recovery_generatenewbackup2 = /** @type {(inputs: Recovery_Generatenewbackup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cela générera un nouveau fichier de sauvegarde. Votre fichier précédent ne fonctionnera plus.`)
};

const ko_recovery_generatenewbackup2 = /** @type {(inputs: Recovery_Generatenewbackup2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 백업 파일이 생성됩니다. 이전 백업 파일은 더 이상 작동하지 않습니다.`)
};

/**
* | output |
* | --- |
* | "This will generate a new backup file. Your previous backup file will no longer work." |
*
* @param {Recovery_Generatenewbackup2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_generatenewbackup2 = /** @type {((inputs?: Recovery_Generatenewbackup2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Generatenewbackup2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_generatenewbackup2(inputs)
	if (locale === "es") return es_recovery_generatenewbackup2(inputs)
	if (locale === "de") return de_recovery_generatenewbackup2(inputs)
	if (locale === "ar") return ar_recovery_generatenewbackup2(inputs)
	if (locale === "fr") return fr_recovery_generatenewbackup2(inputs)
	return ko_recovery_generatenewbackup2(inputs)
});
export { recovery_generatenewbackup2 as "recovery.generateNewBackup" }