/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Placeholder_Recoverykey1Inputs */

const en_recovery_placeholder_recoverykey1 = /** @type {(inputs: Recovery_Placeholder_Recoverykey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paste your recovery key here — it looks like a long string of letters and numbers`)
};

const es_recovery_placeholder_recoverykey1 = /** @type {(inputs: Recovery_Placeholder_Recoverykey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pega tu clave de recuperación aquí — parece una cadena larga de letras y números`)
};

const fr_recovery_placeholder_recoverykey1 = /** @type {(inputs: Recovery_Placeholder_Recoverykey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Collez votre clé de récupération ici — cela ressemble à une longue chaîne de lettres et de chiffres`)
};

const ar_recovery_placeholder_recoverykey1 = /** @type {(inputs: Recovery_Placeholder_Recoverykey1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الصق مفتاح الاسترداد هنا — يبدو كسلسلة طويلة من الأحرف والأرقام`)
};

/**
* | output |
* | --- |
* | "Paste your recovery key here — it looks like a long string of letters and numbers" |
*
* @param {Recovery_Placeholder_Recoverykey1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_placeholder_recoverykey1 = /** @type {((inputs?: Recovery_Placeholder_Recoverykey1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Placeholder_Recoverykey1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_placeholder_recoverykey1(inputs)
	if (locale === "es") return es_recovery_placeholder_recoverykey1(inputs)
	if (locale === "fr") return fr_recovery_placeholder_recoverykey1(inputs)
	return ar_recovery_placeholder_recoverykey1(inputs)
});
export { recovery_placeholder_recoverykey1 as "recovery.placeholder.recoveryKey" }