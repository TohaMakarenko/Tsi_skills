MERGE [Employee] trg
USING (SELECT
		[C].[Name] AS ContactName,
		[C].[Id] AS ContactId,
		ISNULL([L].[JobTitle], '') AS JobTitle,
		ISNULL([Role].[Name], '') AS RoleName,
		[Role].[TSBranchId] AS [TSDepartmentId]
	FROM [SysAdminUnit] AS [User]
	JOIN [Contact] AS [C]
		ON [C].[Id] = [User].[ContactId]
	LEFT JOIN [LDAPElement] AS [L]
		ON [User].[LDAPElementId] = [L].[Id]
	OUTER APPLY (SELECT TOP 1
			[Role].[Name] AS Name,
			[Role].[TSBranchId] AS [TSBranchId]
		FROM [SysUserInRole] AS [SUIR1]
		JOIN [SysAdminUnit] AS [Role]
			ON [Role].id = [SUIR1].SysRoleId
		WHERE [SUIR1].[SysUserId] = [User].[Id]
			AND [Role].[SysAdminUnitTypeValue] = 1
	) Role
	WHERE [User].[SysAdminUnitTypeValue] = 4
		AND NOT EXISTS (SELECT
				NULL
			FROM [SysUserInRole] AS [NotPortalFilter]
			WHERE [User].[Id] = [NotPortalFilter].[SysUserId]
				AND [NotPortalFilter].[SysRoleId] = '720b771c-e7a7-4f31-9cfb-52cd21c3739f'
		)
) src
ON trg.[ContactId] = src.[ContactId]
WHEN MATCHED
	THEN UPDATE
			SET trg.[TSJobText] = [src].[JobTitle],
				trg.[TSDepartmentId] = [src].[TSDepartmentId],
				trg.[TSOrgStructureText] = [src].[RoleName]
WHEN NOT MATCHED BY TARGET
	THEN INSERT (
			[Name],
			[ContactId],
			[TSJobText],
			[TSOrgStructureText],
			[TSDepartmentId])
		VALUES (
			[src].[ContactName],
			[src].[ContactId],
			[src].[JobTitle],
			[src].[RoleName],
			[src].[TSDepartmentId]
		);