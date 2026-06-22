/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Integrationguide_Aitutor_Intro3Inputs */

const en_developerportal_integrationguide_aitutor_intro3 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Intro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`AI Tutor apps let users select learning topics and launch personalized tutoring sessions. LearnCard handles topic selection and passes context to your app.`)
};

const es_developerportal_integrationguide_aitutor_intro3 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Intro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las aplicaciones de Tutor IA permiten a los usuarios seleccionar temas de aprendizaje e iniciar sesiones de tutoría personalizadas. LearnCard maneja la selección de temas y pasa el contexto a tu aplicación.`)
};

const fr_developerportal_integrationguide_aitutor_intro3 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Intro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les applications de Tuteur IA permettent aux utilisateurs de sélectionner des sujets d'apprentissage et de lancer des sessions de tutorat personnalisées. LearnCard gère la sélection des sujets et transmet le contexte à votre application.`)
};

const ar_developerportal_integrationguide_aitutor_intro3 = /** @type {(inputs: Developerportal_Integrationguide_Aitutor_Intro3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تطبيقات المعلم الذكي تتيح للمستخدمين تحديد موضوعات التعلم وإطلاق جلسات تعليمية مخصصة. يتولى LearnCard اختيار الموضوع ويمرر السياق إلى تطبيقك.`)
};

/**
* | output |
* | --- |
* | "AI Tutor apps let users select learning topics and launch personalized tutoring sessions. LearnCard handles topic selection and passes context to your app." |
*
* @param {Developerportal_Integrationguide_Aitutor_Intro3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_integrationguide_aitutor_intro3 = /** @type {((inputs?: Developerportal_Integrationguide_Aitutor_Intro3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Integrationguide_Aitutor_Intro3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_integrationguide_aitutor_intro3(inputs)
	if (locale === "es") return es_developerportal_integrationguide_aitutor_intro3(inputs)
	if (locale === "fr") return fr_developerportal_integrationguide_aitutor_intro3(inputs)
	return ar_developerportal_integrationguide_aitutor_intro3(inputs)
});
export { developerportal_integrationguide_aitutor_intro3 as "developerPortal.integrationGuide.aiTutor.intro" }