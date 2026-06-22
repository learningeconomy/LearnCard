/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Onboarding_Datamapping_Runcodedesc4Inputs */

const en_developerportal_onboarding_datamapping_runcodedesc4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Runcodedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy the code example above and run it in your environment. Then click the button below to verify the credential was issued.`)
};

const es_developerportal_onboarding_datamapping_runcodedesc4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Runcodedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copia el ejemplo de código de arriba y ejecútalo en tu entorno. Luego haz clic en el botón de abajo para verificar que la credencial se emitió.`)
};

const fr_developerportal_onboarding_datamapping_runcodedesc4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Runcodedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiez l'exemple de code ci-dessus et exécutez-le dans votre environnement. Cliquez ensuite sur le bouton ci-dessous pour vérifier que le credential a été émis.`)
};

const ar_developerportal_onboarding_datamapping_runcodedesc4 = /** @type {(inputs: Developerportal_Onboarding_Datamapping_Runcodedesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`انسخ مثال الكود أعلاه وقم بتشغيله في بيئتك. ثم انقر فوق الزر أدناه للتحقق من إصدار بيانات الاعتماد.`)
};

/**
* | output |
* | --- |
* | "Copy the code example above and run it in your environment. Then click the button below to verify the credential was issued." |
*
* @param {Developerportal_Onboarding_Datamapping_Runcodedesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_onboarding_datamapping_runcodedesc4 = /** @type {((inputs?: Developerportal_Onboarding_Datamapping_Runcodedesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Onboarding_Datamapping_Runcodedesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_onboarding_datamapping_runcodedesc4(inputs)
	if (locale === "es") return es_developerportal_onboarding_datamapping_runcodedesc4(inputs)
	if (locale === "fr") return fr_developerportal_onboarding_datamapping_runcodedesc4(inputs)
	return ar_developerportal_onboarding_datamapping_runcodedesc4(inputs)
});
export { developerportal_onboarding_datamapping_runcodedesc4 as "developerPortal.onboarding.dataMapping.runCodeDesc" }