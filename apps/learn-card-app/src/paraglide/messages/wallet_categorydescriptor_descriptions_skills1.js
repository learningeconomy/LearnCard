/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categorydescriptor_Descriptions_Skills1Inputs */

const en_wallet_categorydescriptor_descriptions_skills1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Skills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Skills are abilities or competencies developed through training, practice, or experience that enable an individual to perform tasks effectively. They can be classified into hard skills, which are specific, teachable, and often quantifiable abilities related to a particular task or job, such as coding, welding, or foreign language proficiency. Soft skills, on the other hand, are interpersonal and cognitive abilities that facilitate human interactions, such as communication, problem-solving, and teamwork.`)
};

const es_wallet_categorydescriptor_descriptions_skills1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Skills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las habilidades son capacidades o competencias desarrolladas mediante la formación, la práctica o la experiencia que permiten a una persona realizar tareas de forma eficaz. Pueden clasificarse en habilidades técnicas, que son capacidades específicas, enseñables y a menudo cuantificables relacionadas con una tarea o un trabajo concreto, como programar, soldar o dominar un idioma extranjero. Las habilidades blandas, en cambio, son capacidades interpersonales y cognitivas que facilitan las interacciones humanas, como la comunicación, la resolución de problemas y el trabajo en equipo.`)
};

const fr_wallet_categorydescriptor_descriptions_skills1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Skills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les compétences sont des aptitudes développées par la formation, la pratique ou l'expérience qui permettent à une personne d'accomplir des tâches efficacement. Elles peuvent se classer en compétences techniques, qui sont des aptitudes précises, enseignables et souvent quantifiables liées à une tâche ou à un métier particulier, comme la programmation, la soudure ou la maîtrise d'une langue étrangère. Les compétences relationnelles, quant à elles, sont des aptitudes interpersonnelles et cognitives qui facilitent les interactions humaines, comme la communication, la résolution de problèmes et le travail en équipe.`)
};

const ar_wallet_categorydescriptor_descriptions_skills1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Skills1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المهارات هي قدرات أو كفاءات تُطوَّر من خلال التدريب أو الممارسة أو الخبرة وتمكّن الفرد من أداء المهام بفعالية. ويمكن تصنيفها إلى مهارات تقنية، وهي قدرات محددة وقابلة للتعليم وغالباً قابلة للقياس مرتبطة بمهمة أو وظيفة معينة، مثل البرمجة أو اللحام أو إتقان لغة أجنبية. أما المهارات الناعمة فهي قدرات شخصية وإدراكية تسهّل التفاعلات الإنسانية، مثل التواصل وحل المشكلات والعمل الجماعي.`)
};

/**
* | output |
* | --- |
* | "Skills are abilities or competencies developed through training, practice, or experience that enable an individual to perform tasks effectively. They can be ..." |
*
* @param {Wallet_Categorydescriptor_Descriptions_Skills1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categorydescriptor_descriptions_skills1 = /** @type {((inputs?: Wallet_Categorydescriptor_Descriptions_Skills1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categorydescriptor_Descriptions_Skills1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categorydescriptor_descriptions_skills1(inputs)
	if (locale === "es") return es_wallet_categorydescriptor_descriptions_skills1(inputs)
	if (locale === "fr") return fr_wallet_categorydescriptor_descriptions_skills1(inputs)
	return ar_wallet_categorydescriptor_descriptions_skills1(inputs)
});
export { wallet_categorydescriptor_descriptions_skills1 as "wallet.categoryDescriptor.descriptions.skills" }