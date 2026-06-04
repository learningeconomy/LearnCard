/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Temporarysession1Inputs */

const en_recovery_temporarysession1 = /** @type {(inputs: Recovery_Temporarysession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This is a temporary session. Closing the tab will sign you out permanently unless you set up a recovery method.`)
};

const es_recovery_temporarysession1 = /** @type {(inputs: Recovery_Temporarysession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta es una sesión temporal. Cerrar la pestaña cerrará tu sesión permanentemente a menos que configures un método de recuperación.`)
};

const de_recovery_temporarysession1 = /** @type {(inputs: Recovery_Temporarysession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dies ist eine vorübergehende Sitzung. Das Schließen des Tabs meldet dich dauerhaft ab, es sei denn, du richtest eine Wiederherstellungsmethode ein.`)
};

const ar_recovery_temporarysession1 = /** @type {(inputs: Recovery_Temporarysession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هذه جلسة مؤقتة. إغلاق علامة التبويب سيؤدي إلى تسجيل خروجك نهائياً ما لم تقم بإعداد طريقة استعادة.`)
};

const fr_recovery_temporarysession1 = /** @type {(inputs: Recovery_Temporarysession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ceci est une session temporaire. Fermer l'onglet vous déconnectera définitivement sauf si vous configurez une méthode de récupération.`)
};

const ko_recovery_temporarysession1 = /** @type {(inputs: Recovery_Temporarysession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`임시 세션입니다. 복구 방법을 설정하지 않으면 탭을 닫을 때 영구적으로 로그아웃됩니다.`)
};

/**
* | output |
* | --- |
* | "This is a temporary session. Closing the tab will sign you out permanently unless you set up a recovery method." |
*
* @param {Recovery_Temporarysession1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const recovery_temporarysession1 = /** @type {((inputs?: Recovery_Temporarysession1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Temporarysession1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_temporarysession1(inputs)
	if (locale === "es") return es_recovery_temporarysession1(inputs)
	if (locale === "de") return de_recovery_temporarysession1(inputs)
	if (locale === "ar") return ar_recovery_temporarysession1(inputs)
	if (locale === "fr") return fr_recovery_temporarysession1(inputs)
	return ko_recovery_temporarysession1(inputs)
});
export { recovery_temporarysession1 as "recovery.temporarySession" }