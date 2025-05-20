

# AuthGrantsGetAuthGrants200ResponseInner


## Properties

| Name | Type | Description | Notes |
|------------ | ------------- | ------------- | -------------|
|**id** | **String** |  |  |
|**name** | **String** |  |  |
|**description** | **String** |  |  [optional] |
|**challenge** | **String** |  |  |
|**status** | [**StatusEnum**](#StatusEnum) |  |  |
|**scope** | **String** |  |  |
|**createdAt** | **OffsetDateTime** |  |  |
|**expiresAt** | **OffsetDateTime** |  |  [optional] |



## Enum: StatusEnum

| Name | Value |
|---- | -----|
| REVOKED | &quot;revoked&quot; |
| ACTIVE | &quot;active&quot; |



