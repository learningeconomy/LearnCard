import SwiftUI
import LearnCardNativeCore
import LearnCardNativeSDK

/// Read-only projection of the original record. The signed source remains unchanged.
struct CredentialTranscriptSection: View {
    @Environment(\.locale) private var locale
    let transcript: CredentialTranscript
    @State private var expanded = false

    private var hasMore: Bool {
        transcript.groups.count > 2 || transcript.groups.contains { $0.records.count > 3 }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(NativeText.text(transcript.kind == "academic" ? "transcript.academic" : "transcript.general"))
                .font(.headline).foregroundStyle(Palette.ink)
                .accessibilityAddTraits(.isHeader)
            if let learner = transcript.learner, !learner.isEmpty {
                LabeledContent(NativeText.text("transcript.learner"), value: learner)
                    .font(.subheadline).foregroundStyle(Palette.secondary)
                    .accessibilityIdentifier("transcript-learner")
            }
            if transcript.groups.allSatisfy({ $0.records.isEmpty }) {
                Text(NativeText.text("transcript.empty")).font(.subheadline).foregroundStyle(Palette.secondary)
                    .accessibilityIdentifier("transcript-empty")
            }
            ForEach(Array(transcript.groups.prefix(expanded ? transcript.groups.count : 2).enumerated()), id: \.offset) { index, group in
                if !group.records.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text(group.term.flatMap { $0.isEmpty ? nil : $0 } ?? groupTitle(group.kind))
                            .font(.subheadline.weight(.semibold)).foregroundStyle(Palette.ink)
                            .accessibilityAddTraits(.isHeader)
                        ForEach(Array(group.records.prefix(expanded ? group.records.count : 3).enumerated()), id: \.offset) { recordIndex, record in
                            recordRow(record)
                                .accessibilityIdentifier("transcript-record-\(index)-\(recordIndex)")
                            if recordIndex < min(group.records.count, expanded ? group.records.count : 3) - 1 { Divider() }
                        }
                    }
                    if index < min(transcript.groups.count, expanded ? transcript.groups.count : 2) - 1 { Divider() }
                }
            }
            if hasMore {
                Button { expanded.toggle() } label: {
                    Text(NativeText.text(expanded ? "credential.details.showLess" : "transcript.showAll"))
                        .font(.subheadline.weight(.semibold)).foregroundStyle(Palette.green)
                        .frame(minHeight: 44).contentShape(Rectangle())
                }.buttonStyle(CredentialPressStyle()).accessibilityIdentifier("transcript-expand")
            }
            if transcript.partial == true {
                Text(NativeText.text("transcript.partial"))
                    .font(.footnote).foregroundStyle(Palette.secondary)
                    .accessibilityIdentifier("transcript-partial")
            }
        }.padding(20).frame(maxWidth: .infinity, alignment: .leading)
            .background(Palette.surface, in: RoundedRectangle(cornerRadius: 22))
            .accessibilityElement(children: .contain).accessibilityIdentifier("credential-transcript")
    }

    private func groupTitle(_ kind: String) -> String {
        switch kind {
        case "courses": NativeText.text("transcript.courses")
        case "programs": NativeText.text("transcript.programs")
        default: NativeText.text("transcript.records")
        }
    }

    private func recordRow(_ record: CredentialTranscriptRecord) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(record.name).font(.subheadline.weight(.semibold)).foregroundStyle(Palette.ink)
                .fixedSize(horizontal: false, vertical: true)
            if let code = record.code, !code.isEmpty {
                Text(code).font(.caption).foregroundStyle(Palette.secondary)
            }
            if let credits = record.credits {
                let quantity = credits.amount.formatted(.number.precision(.fractionLength(0...6)).locale(locale))
                let value = [quantity, credits.unit].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " ")
                LabeledContent(NativeText.text(credits.kind == "earned" ? "transcript.creditsEarned" : "transcript.creditsAvailable"), value: value)
                    .font(.subheadline).foregroundStyle(Palette.secondary)
            }
            ForEach(Array(record.results.enumerated()), id: \.offset) { _, result in
                let resultValue = [result.value, result.status].compactMap { $0 }.filter { !$0.isEmpty }.joined(separator: " · ")
                if let label = result.label, !label.isEmpty {
                    LabeledContent(label, value: resultValue).font(.subheadline).foregroundStyle(Palette.secondary)
                } else if !resultValue.isEmpty {
                    Text(resultValue).font(.subheadline).foregroundStyle(Palette.secondary)
                }
            }
        }.frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityElement(children: .contain)
    }
}
