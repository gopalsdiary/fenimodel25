Options
Name	Required	Description
rows	It depends	
If you render rows by yourself - pass array of tags in String. This way is preferable.
Example: ['<tr><td>First</td></tr>', '<tr><td>Second</td></tr>'];
If you need to use existing markup - do not specify this option at all.
scrollId or scrollElem	Required	Id or DOM node of parent tag which used as scroll area. Example: scrollId: 'scrollArea' or scrollElem: document.getElementById('scrollArea')
contentId or contentElem	Required	Id or DOM node of tag where content will be placed. Example: contentId: 'contentArea' or contentElem: document.getElementById('contentArea')
tag	Optional	Tag name for supporting elements: spacing extra rows, empty-data row. It will be determined by itself once data provided, so it's optional. But if your data is not provided during initialization - it is better to specify this option because otherwise plugin will be unable to correctly render empty-data row. Example: 'tr'. Default: null
rows_in_block	Optional	Amount of rows in block. Increase means browser will be more loaded, decrease means browser will have to update clusters more often. This example would help to understand this property easier. Good practice will be to keep rows_in_block as amount of visible rows in your list. Must be even to keep parity. Default: 50
blocks_in_cluster	Optional	Amount of blocks in cluster. When scroll reaches last block - content replaces with next cluster. Default: 4
show_no_data_row	Optional	Specifies whether to display an "empty" placeholder row if there is no data provided. Default: true
no_data_text	Optional	Text for placeholder element if there is no data provided. Default: 'No data'
no_data_class	Optional	Class for placeholder element if there is no data provided. Default: 'clusterize-no-data'
keep_parity	Optional	Add extra tag to keep parity of rows. Useful when used :nth-child(even/odd). Default: true
Methods
Name	Parameter	Description
.update()	Array	Updates list with new data
.append()	Array	Appends new data to the list
.prepend()	Array	Prepends new data to the list
.refresh()	Bool	Refreshes row height. Clusterize must always know current row height. It watches for window resize by itself but the width of the container may be changed programmatically, for example by dynamic neighboring elements, which could lead to a change in the height of rows. In such cases, you must call .refresh () to force Clusterize get new row height.
Optional parameter (true) may be passed to force update Clusterize's processing, even if row height hasn't been changed. See #85 to get idea when it needed.
.getRowsAmount()		Returns total amount of rows
.getScrollProgress()		Returns current scroll progress
.clear()		Clears the list
.destroy()	Bool	Destroys clusterize instance. Parameter: true - removes all data from the list, not specify or false - inserts all hidden data to the list
Callbacks
Name	Description
clusterWillChange	Will be called right before replacing previous cluster with new one.
clusterChanged	Will be called right after replacing previous cluster with new one.
scrollingProgress	Will be called on scrolling. Returns progress position.

# Clusterize.js
[![Clusterize.js on NPM](https://img.shields.io/npm/v/clusterize.js.svg)](https://www.npmjs.com/package/clusterize.js) 
[![Package Quality](http://npm.packagequality.com/shield/clusterize.js.svg)](http://packagequality.com/#?package=clusterize.js)
[![Gzip Size](http://img.badgesize.io/https://cdn.jsdelivr.net/npm/clusterize.js/clusterize.min.js?compression=gzip)](https://cdn.jsdelivr.net/npm/clusterize.js/clusterize.min.js)
[![Install Size](https://packagephobia.now.sh/badge?p=clusterize.js)](https://packagephobia.now.sh/result?p=clusterize.js)
[![Download Count](https://img.shields.io/npm/dt/clusterize.js.svg)](https://www.npmjs.com/package/clusterize.js)
[![Join the chat at https://gitter.im/NeXTs/Clusterize.js](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/NeXTs/Clusterize.js?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

> Tiny vanilla JS plugin to display large data sets easily

[Demo, usage, etc…](https://clusterize.js.org/)

[![example](http://nexts.github.io/Clusterize.js/img/table_example.gif)](https://clusterize.js.org/)

Quickstart >
bower install clusterize
npm install clusterize.js


Rendered structure and classes (in case you decided to use tables)
<div class="clusterize">
  <table>
    <thead>
      <tr>
        <th>Headers</th>
      </tr>
    </thead>
  </table>
  <div id="scrollArea" class="clusterize-scroll">
    <table>
      <tbody id="contentArea" class="clusterize-content">
        <tr class="clusterize-extra-row clusterize-keep-parity"></tr>
        <tr class="clusterize-extra-row clusterize-top-space" style="height:12345px;"></tr>

        <!--tr>Your (rows_in_block * blocks_in_cluster) rows</tr-->
        
        <tr class="clusterize-extra-row clusterize-bottom-space" style="height:12345px;"></tr>
      </tbody>
    </table>
  </div>
</div>




// Callbacks usage example
var clusterize = new Clusterize({
  …
  callbacks: {
    clusterWillChange: function() {},
    clusterChanged: function() {},
    scrollingProgress: function(progress) {}
  }
});




<!--HTML--> table example
<div class="clusterize">
  <table>
    <thead>
      <tr>
        <th>Headers</th>
      </tr>
    </thead>
  </table>
  <div id="scrollArea" class="clusterize-scroll">
    <table>
      <tbody id="contentArea" class="clusterize-content">
        <tr class="clusterize-no-data">
          <td>Loading data…</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>