# True when the plan leaves the ECS scalable target's sizing untouched: either a
# no-op, or an in-place update whose only differences are tags/tags_all.
[.resource_changes[] | select(.address == "aws_appautoscaling_target.keycloak") | .change]
| length == 1 and (.[0] | .actions == ["no-op"] or (
    .actions == ["update"]
    and ((.before // {}) | del(.tags, .tags_all)) == ((.after // {}) | del(.tags, .tags_all))
    and ((.after_unknown // {}) | del(.tags, .tags_all) | [.. | select(. == true)] | length == 0)
))
