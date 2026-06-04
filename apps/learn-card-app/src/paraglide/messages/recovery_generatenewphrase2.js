/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Generatenewphrase2Inputs */

const en_recovery_generatenewphrase2 = /** @type {(inputs: Recovery_Generatenewphrase2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This will generate a new phrase. Your previous phrase will no longer work.`)
};

const es_recovery_generatenewphrase2 = /** @type {(inputs: Recovery_Generatenewphrase2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esto generará una nueva frase. Tu frase anterior ya no funcionará.`)
};

const de_recovery_generatenewphrase2 = /** @type {(inputs: Recovery_Generatenewphrase2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dadurch wird eine neue Phrase generiert. Deine vorherige Phrase funktioniert nicht mehr.`)
};

const ar_recovery_generatenewphrase2 = /** @type {(inputs: Recovery_Generatenewphrase2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيؤدي هذا إلى إنشاء عبارة جديدة. عبارتك السابقة لن تعمل بعد الآن.`)
};

const fr_recovery_generatenewphrase2 = /** @type {(inputs: Recovery_Generatenewphrase2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cela générera une nouvelle phrase. Votre phrase précédente ne fonctionnera plus.`)
};

const ko_recovery_generatenewphrase2 = /** @type {(inputs: Recovery_Generatenewphrase2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`새 구문이 생성됩니다. 이전 구문은 더 이상 작동하지 않습니다.`)
};

/**
* | output |
* | --- |
* | "This will generate a new phrase. Your previous phrase will no longer work." |
*
* @param {Recovery_Generatenewphrase2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_generatenewphrase2 = /** @type {((inputs?: Recovery_Generatenewphrase2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Generatenewphrase2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_generatenewphrase2(inputs)
	if (locale === "es") return es_recovery_generatenewphrase2(inputs)
	if (locale === "de") return de_recovery_generatenewphrase2(inputs)
	if (locale === "ar") return ar_recovery_generatenewphrase2(inputs)
	if (locale === "fr") return fr_recovery_generatenewphrase2(inputs)
	return ko_recovery_generatenewphrase2(inputs)
});
export { recovery_generatenewphrase2 as "recovery.generateNewPhrase" }