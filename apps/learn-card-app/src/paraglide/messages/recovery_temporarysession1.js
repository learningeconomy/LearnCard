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

const fr_recovery_temporarysession1 = /** @type {(inputs: Recovery_Temporarysession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ceci est une session temporaire. Fermer l'onglet vous déconnectera définitivement sauf si vous configurez une méthode de récupération.`)
};

const ar_recovery_temporarysession1 = /** @type {(inputs: Recovery_Temporarysession1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هذه جلسة مؤقتة. إغلاق علامة التبويب سيؤدي إلى تسجيل خروجك نهائياً ما لم تقم بإعداد طريقة استعادة.`)
};

/**
* | output |
* | --- |
* | "This is a temporary session. Closing the tab will sign you out permanently unless you set up a recovery method." |
*
* @param {Recovery_Temporarysession1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_temporarysession1 = /** @type {((inputs?: Recovery_Temporarysession1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Temporarysession1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_temporarysession1(inputs)
	if (locale === "es") return es_recovery_temporarysession1(inputs)
	if (locale === "fr") return fr_recovery_temporarysession1(inputs)
	return ar_recovery_temporarysession1(inputs)
});
export { recovery_temporarysession1 as "recovery.temporarySession" }