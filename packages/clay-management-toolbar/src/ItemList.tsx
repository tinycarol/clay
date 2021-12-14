/**
 * SPDX-FileCopyrightText: © 2019 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: BSD-3-Clause
 */

import classNames from 'classnames';
import React from 'react';

interface IProps extends React.HTMLAttributes<HTMLUListElement> {
	/**
	 * Flag to indicate the Management Toolbar Item List should fit the width of the parent container.
	 */
	expand?: boolean;
}

const ItemList = React.forwardRef<HTMLUListElement, IProps>(
	({children, className, expand, ...otherProps}: IProps, ref) => (
		<ul
			className={classNames(className, 'navbar-nav', {
				'navbar-nav-expand': expand,
			})}
			ref={ref}
			{...otherProps}
		>
			{children}
		</ul>
	)
);

ItemList.displayName = 'ItemList';

export default ItemList;
